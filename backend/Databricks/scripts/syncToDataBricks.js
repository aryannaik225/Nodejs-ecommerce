import dotenv from 'dotenv';
import prisma from '../../config/prisma.js';
import { DBSQLClient } from '@databricks/sql';

dotenv.config();

const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_PATH = process.env.DATABRICKS_PATH;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;

const escapeStr = (str) => str ? str.replace(/'/g, "''") : "";

async function executeAndWait(session, query) {
  const operation = await session.executeStatement(query);
  await operation.fetchAll(); 
  await operation.close();
}

const tablesToSync = [
  {
    name: "orders_bronze",
    extract: () => prisma.orders.findMany({
      select: { id: true, user_id: true, total_amount: true, payment_status: true, order_status: true, created_at: true }
    }),
    schema: `id INT, user_id INT, total_amount INT, payment_status STRING, order_status STRING, created_at TIMESTAMP`,
    mapValues: (o) => `(${o.id}, ${o.user_id}, ${o.total_amount}, '${o.payment_status}', '${o.order_status}', '${o.created_at ? o.created_at.toISOString() : new Date().toISOString()}')`
  },
  {
    name: "order_items_bronze",
    extract: () => prisma.order_items.findMany({
      select: { id: true, order_id: true, product_id: true, product_price: true, quantity: true }
    }),
    schema: `id INT, order_id INT, product_id INT, product_price INT, quantity INT`,
    mapValues: (i) => `(${i.id}, ${i.order_id}, ${i.product_id}, ${i.product_price}, ${i.quantity})`
  },
  {
    name: "products_bronze",
    extract: () => prisma.products.findMany({
      select: { id: true, title: true, price: true, stock: true }
    }),
    schema: `id INT, title STRING, price INT, stock INT`,
    mapValues: (p) => `(${p.id}, '${escapeStr(p.title)}', ${p.price}, ${p.stock})`
  }
];

async function runPipeline() {
  console.log("🚀 Starting TiDB to Databricks Multi-Table Pipeline...");
  
  const client = new DBSQLClient();
  let session;

  try {
    console.log("🔌 Connecting to Databricks Serverless Warehouse...");
    await client.connect({ host: DATABRICKS_HOST, path: DATABRICKS_PATH, token: DATABRICKS_TOKEN });
    session = await client.openSession();

    console.log("🏗️ Ensuring schema exists...");
    await executeAndWait(session, `CREATE SCHEMA IF NOT EXISTS ecommerce_analytics;`);
    await executeAndWait(session, `USE SCHEMA ecommerce_analytics;`);

    for (const table of tablesToSync) {
      console.log(`\n--- Processing ${table.name} ---`);
      
      console.log(`📦 Extracting data from TiDB...`);
      const data = await table.extract();
      console.log(`✅ Extracted ${data.length} records.`);

      if (data.length === 0) {
        console.log(`⏭️ Skipping ${table.name}, no data found.`);
        continue;
      }

      console.log(`💥 Dropping old table to reset schema...`);
      await executeAndWait(session, `DROP TABLE IF EXISTS ${table.name};`);

      console.log(`🏗️ Creating Delta Table...`);
      await executeAndWait(session, `CREATE TABLE IF NOT EXISTS ${table.name} (${table.schema}) USING DELTA;`);

      // console.log(`🧹 Truncating old data...`);
      // await executeAndWait(session, `TRUNCATE TABLE ${table.name};`);

      console.log(`🚚 Loading new batch into Databricks...`);
      const values = data.map(table.mapValues).join(",\n");
      const insertQuery = `INSERT INTO ${table.name} VALUES \n${values};`;
      
      await executeAndWait(session, insertQuery);
      console.log(`✅ ${table.name} sync complete!`);
    }

    console.log("\n🎉 Full Pipeline Complete! All core data is safely in the Lakehouse.");

  } catch (error) {
    console.error("❌ Pipeline Failed:", error);
  } finally {
    if (session) await session.close();
    await client.close();
    await prisma.$disconnect();
  }
}

runPipeline();