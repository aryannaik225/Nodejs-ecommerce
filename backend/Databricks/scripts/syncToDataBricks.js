import dotenv from 'dotenv';
import prisma from '../../config/prisma.js';
import { DBSQLClient } from '@databricks/sql';

dotenv.config();

const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_PATH = process.env.DATABRICKS_PATH;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;

// Helper function to force Node to wait for Databricks to finish
async function executeAndWait(session, query) {
  const operation = await session.executeStatement(query);
  await operation.fetchAll(); // This tells Node to wait until the server says "Done!"
  await operation.close();
}

async function runPipeline() {
  console.log("🚀 Starting TiDB to Databricks Pipeline...");
  
  const client = new DBSQLClient();
  let session;

  try {
    console.log("📦 Extracting orders from TiDB...");
    const orders = await prisma.orders.findMany({
      select: {
        id: true,
        user_id: true,
        total_amount: true,
        payment_status: true,
        order_status: true,
      }
    });
    console.log(`✅ Extracted ${orders.length} orders.`);

    console.log("🔌 Connecting to Databricks Serverless Warehouse...");
    await client.connect({
      host: DATABRICKS_HOST,
      path: DATABRICKS_PATH,
      token: DATABRICKS_TOKEN,
    });
    session = await client.openSession();

    const tableName = "orders_bronze";

    console.log("🏗️ Creating dedicated schema (folder) for our data...");
    await executeAndWait(session, `CREATE SCHEMA IF NOT EXISTS ecommerce_analytics;`);
    
    await executeAndWait(session, `USE SCHEMA ecommerce_analytics;`);

    console.log("🏗️ Creating Databricks Delta Table...");
    await executeAndWait(session, `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT,
        user_id INT,
        total_amount INT,
        payment_status STRING,
        order_status STRING
      ) USING DELTA;
    `);

    console.log("🧹 Clearing old data from Bronze layer...");
    await executeAndWait(session, `TRUNCATE TABLE ${tableName};`);

    console.log("🚚 Loading new batches into Databricks...");
    
    const values = orders.map(o => 
      `(${o.id}, ${o.user_id}, ${o.total_amount}, '${o.payment_status}', '${o.order_status}')`
    ).join(",\n");

    const insertQuery = `INSERT INTO ${tableName} VALUES \n${values};`;
    await executeAndWait(session, insertQuery);

    console.log("🎉 Pipeline Complete! Data is safely in the Lakehouse.");

  } catch (error) {
    console.error("❌ Pipeline Failed:", error);
  } finally {
    if (session) await session.close();
    await client.close();
    await prisma.$disconnect();
  }
}

runPipeline();