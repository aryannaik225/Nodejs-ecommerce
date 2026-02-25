import { DBSQLClient } from '@databricks/sql';
import prisma from '../../config/prisma.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { DATABRICKS_HOST, DATABRICKS_PATH, DATABRICKS_TOKEN } = process.env;

const escapeStr = (str) => str ? str.replace(/'/g, "''") : "";

const executeAndWait = async (session, query) => {
  const operation = await session.executeStatement(query);
  const res = await operation.fetchAll();
  await operation.close();
  return res;
};

export const runDatabricksPipeline = async (orderId) => {
  console.log(`🚀 [Databricks] Triggering automated pipeline for Order ID: ${orderId}`);
  const client = new DBSQLClient();
  let session;

  try {
    // 1. Extract fresh data from TiDB (Now including Users and Discounts!)
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        order_items: { include: { products: true } },
        users: true,
        DiscountCode: true
      }
    });

    if (!order) {
      console.log(`❌ [Databricks] Order ${orderId} not found in TiDB.`);
      return;
    }

    await client.connect({ host: DATABRICKS_HOST, path: DATABRICKS_PATH, token: DATABRICKS_TOKEN });
    session = await client.openSession();
    await session.executeStatement(`USE SCHEMA ecommerce_analytics;`);

    // 2. ENSURE TABLES EXIST (Protects against schema errors on new deployments)
    console.log(`🏗️ [Databricks] Verifying Bronze schemas...`);
    await executeAndWait(session, `CREATE TABLE IF NOT EXISTS users_bronze (id INT, name STRING, email STRING) USING DELTA;`);
    await executeAndWait(session, `CREATE TABLE IF NOT EXISTS discounts_bronze (id INT, code STRING, discountType STRING, uses INT) USING DELTA;`);
    await executeAndWait(session, `CREATE TABLE IF NOT EXISTS products_bronze (id INT, title STRING, price INT, stock INT) USING DELTA;`);
    await executeAndWait(session, `CREATE TABLE IF NOT EXISTS order_items_bronze (id INT, order_id INT, product_id INT, product_price INT, quantity INT) USING DELTA;`);
    await executeAndWait(session, `CREATE TABLE IF NOT EXISTS orders_bronze (id INT, user_id INT, total_amount INT, payment_status STRING, order_status STRING, created_at TIMESTAMP, discountCodeId INT) USING DELTA;`);

    // 3. BRONZE LAYER (Upsert / Merge Data)
    console.log(`🥉 [Databricks] Upserting Bronze Layer with new event data...`);

    // Merge User
    if (order.users) {
      await executeAndWait(session, `
        MERGE INTO users_bronze target
        USING (SELECT ${order.users.id} as id, '${escapeStr(order.users.name)}' as name, '${escapeStr(order.users.email)}' as email) source
        ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET *
        WHEN NOT MATCHED THEN INSERT *;
      `);
    }

    // Merge Discount Code (If used)
    if (order.DiscountCode) {
      await executeAndWait(session, `
        MERGE INTO discounts_bronze target
        USING (SELECT ${order.DiscountCode.id} as id, '${escapeStr(order.DiscountCode.code)}' as code, '${order.DiscountCode.discountType}' as discountType, ${order.DiscountCode.uses} as uses) source
        ON target.id = source.id
        WHEN MATCHED THEN UPDATE SET *
        WHEN NOT MATCHED THEN INSERT *;
      `);
    }

    // Merge Order
    const createdAt = order.created_at ? order.created_at.toISOString() : new Date().toISOString();
    const discountId = order.discountCodeId ? order.discountCodeId : 'NULL';
    await executeAndWait(session, `
      MERGE INTO orders_bronze target
      USING (SELECT ${order.id} as id, ${order.user_id} as user_id, ${order.total_amount} as total_amount, '${order.payment_status}' as payment_status, '${order.order_status}' as order_status, '${createdAt}' as created_at, ${discountId} as discountCodeId) source
      ON target.id = source.id
      WHEN MATCHED THEN UPDATE SET *
      WHEN NOT MATCHED THEN INSERT *;
    `);

    // Merge Order Items & Associated Products
    if (order.order_items.length > 0) {
      for (const item of order.order_items) {
        // Upsert the Product to keep catalog/pricing up to date
        if (item.products) {
          await executeAndWait(session, `
            MERGE INTO products_bronze target
            USING (SELECT ${item.products.id} as id, '${escapeStr(item.products.title)}' as title, ${item.products.price} as price, ${item.products.stock} as stock) source
            ON target.id = source.id
            WHEN MATCHED THEN UPDATE SET *
            WHEN NOT MATCHED THEN INSERT *;
          `);
        }

        // Upsert the Order Item
        await executeAndWait(session, `
          MERGE INTO order_items_bronze target
          USING (SELECT ${item.id} as id, ${item.order_id} as order_id, ${item.product_id} as product_id, ${item.product_price} as product_price, ${item.quantity} as quantity) source
          ON target.id = source.id
          WHEN MATCHED THEN UPDATE SET *
          WHEN NOT MATCHED THEN INSERT *;
        `);
      }
    }

    // 4. SILVER LAYER (Cleaned & Joined View)
    console.log(`🥈 [Databricks] Updating Silver Layer...`);
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

    // 5. GOLD LAYER (Business Aggregation View - Ready for Tableau)
    console.log(`🥇 [Databricks] Updating Gold Layer...`);
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

    // 6. EXPORT FOR TABLEAU
    console.log(`📝 [Databricks] Fetching Gold data for Tableau Export...`);
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
      console.log(`🎉 [Databricks] Pipeline complete! CSV updated at: ${exportPath}`);
    }

  } catch (error) {
    console.error("❌ [Databricks] Pipeline Error:", error);
  } finally {
    if (session) await session.close();
    await client.close();
  }
};