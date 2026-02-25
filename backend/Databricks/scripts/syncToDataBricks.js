import dotenv from 'dotenv';
import prisma from '../../config/prisma.js';
import { DBSQLClient } from '@databricks/sql';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { DATABRICKS_HOST, DATABRICKS_PATH, DATABRICKS_TOKEN } = process.env;
const escapeStr = (str) => str ? str.replace(/'/g, "''") : "";

async function executeAndWait(session, query) {
  const operation = await session.executeStatement(query);
  const results = await operation.fetchAll();
  await operation.close();
  return results;
}

const tablesToSync = [
  {
    name: "users_bronze",
    extract: () => prisma.users.findMany({ select: { id: true, name: true, email: true } }),
    schema: `id INT, name STRING, email STRING`,
    mapValues: (u) => `(${u.id}, '${escapeStr(u.name)}', '${escapeStr(u.email)}')`
  },
  {
    name: "discounts_bronze",
    extract: () => prisma.DiscountCode.findMany({ select: { id: true, code: true, discountType: true, uses: true } }),
    schema: `id INT, code STRING, discountType STRING, uses INT`,
    mapValues: (d) => `(${d.id}, '${escapeStr(d.code)}', '${d.discountType}', ${d.uses})`
  },
  {
    name: "products_bronze",
    extract: () => prisma.products.findMany({ select: { id: true, title: true, price: true, stock: true } }),
    schema: `id INT, title STRING, price INT, stock INT`,
    mapValues: (p) => `(${p.id}, '${escapeStr(p.title)}', ${p.price}, ${p.stock})`
  },
  {
    name: "orders_bronze",
    extract: () => prisma.orders.findMany({ select: { id: true, user_id: true, total_amount: true, payment_status: true, order_status: true, created_at: true, discountCodeId: true } }),
    schema: `id INT, user_id INT, total_amount INT, payment_status STRING, order_status STRING, created_at TIMESTAMP, discountCodeId INT`,
    mapValues: (o) => `(${o.id}, ${o.user_id}, ${o.total_amount}, '${o.payment_status}', '${o.order_status}', '${o.created_at ? o.created_at.toISOString() : new Date().toISOString()}', ${o.discountCodeId || 'NULL'})`
  },
  {
    name: "order_items_bronze",
    extract: () => prisma.order_items.findMany({ select: { id: true, order_id: true, product_id: true, product_price: true, quantity: true } }),
    schema: `id INT, order_id INT, product_id INT, product_price INT, quantity INT`,
    mapValues: (i) => `(${i.id}, ${i.order_id}, ${i.product_id}, ${i.product_price}, ${i.quantity})`
  }
];

async function runInitialBackfill() {
  console.log("🚀 Starting One-Time Historical Backfill to Databricks...");
  const client = new DBSQLClient();
  let session;

  try {
    await client.connect({ host: DATABRICKS_HOST, path: DATABRICKS_PATH, token: DATABRICKS_TOKEN });
    session = await client.openSession();
    await executeAndWait(session, `CREATE SCHEMA IF NOT EXISTS ecommerce_analytics;`);
    await executeAndWait(session, `USE SCHEMA ecommerce_analytics;`);

    // 1. Build Bronze Layer
    for (const table of tablesToSync) {
      console.log(`\n📦 Extracting ${table.name} from TiDB...`);
      const data = await table.extract();

      console.log(`💥 Resetting schema...`);
      await executeAndWait(session, `DROP TABLE IF EXISTS ${table.name};`);
      await executeAndWait(session, `CREATE TABLE ${table.name} (${table.schema}) USING DELTA;`);

      if (data.length === 0) {
        console.log(`⏭️ Skipping insert, no data found.`);
        continue;
      }

      console.log(`🚚 Loading ${data.length} records into Databricks...`);
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const values = batch.map(table.mapValues).join(",\n");
        await executeAndWait(session, `INSERT INTO ${table.name} VALUES \n${values};`);
      }
      console.log(`✅ ${table.name} complete!`);
    }

    // 2. Build Silver Layer
    console.log(`\n🥈 Creating Silver Views...`);
    await executeAndWait(session, `
      CREATE OR REPLACE VIEW orders_silver_view AS
      SELECT 
        o.id as order_id, o.user_id, o.total_amount, o.payment_status, o.order_status, o.created_at,
        u.name as user_name, u.email as user_email,
        d.code as discount_code, d.discountType as discount_type
      FROM orders_bronze o
      LEFT JOIN users_bronze u ON o.user_id = u.id
      LEFT JOIN discounts_bronze d ON o.discountCodeId = d.id
      WHERE o.payment_status != 'failed' AND o.order_status != 'cancelled';
    `);

    // 3. Build Gold Layer
    console.log(`🥇 Creating Gold Views...`);
    await executeAndWait(session, `
      CREATE OR REPLACE VIEW tableau_gold_view AS
      SELECT 
        s.order_id,
        s.created_at AS order_date,
        s.order_status,
        s.user_name,
        s.user_email,
        COALESCE(s.discount_code, 'None') AS promo_code_used,
        p.title AS product_name,
        oi.quantity AS units_sold,
        (oi.quantity * oi.product_price / 100) AS gross_revenue_usd,
        (s.total_amount / 100) AS net_order_total_usd
      FROM orders_silver_view s
      JOIN order_items_bronze oi ON s.order_id = oi.order_id
      JOIN products_bronze p ON oi.product_id = p.id;
    `);

    // 4. Initial CSV Export
    console.log(`\n📝 Generating Initial Tableau CSV...`);
    const results = await executeAndWait(session, `SELECT * FROM tableau_gold_view ORDER BY order_date DESC`);

    if (results.length > 0) {
      const headers = Object.keys(results[0]).join(',');
      const csvRows = results.map(row =>
        Object.values(row).map(val => {
          if (val instanceof Date) {
            return val.toISOString();
          }
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val}"`;
          }
          return val;
        }).join(',')
      );
      const exportPath = path.resolve('../../Tableau/tableau_data_feed.csv');
      fs.writeFileSync(exportPath, [headers, ...csvRows].join('\n'));
      console.log(`🎉 Success! Initial CSV created at: ${exportPath}`);
    }

  } catch (error) {
    console.error("❌ Pipeline Failed:", error);
  } finally {
    if (session) await session.close();
    await client.close();
    await prisma.$disconnect();
  }
}

runInitialBackfill();