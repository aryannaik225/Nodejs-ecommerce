import { DBSQLClient } from '@databricks/sql';
import dotenv from 'dotenv';

dotenv.config();

const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_PATH = process.env.DATABRICKS_PATH;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;

// Initialize a global client for the server
const client = new DBSQLClient();

export const getDashboardData = async (req, res) => {
  let session;
  
  try {
    // 1. Connect to Databricks
    await client.connect({
      host: DATABRICKS_HOST,
      path: DATABRICKS_PATH,
      token: DATABRICKS_TOKEN,
    });
    
    session = await client.openSession();
    await session.executeStatement(`USE SCHEMA ecommerce_analytics;`);

    // Helper to execute and fetch
    const fetchQuery = async (query) => {
      const operation = await session.executeStatement(query);
      const result = await operation.fetchAll();
      await operation.close();
      return result;
    };

    // 2. Run our Analytical Queries in parallel for speed
    console.log("📊 Fetching analytics from Databricks...");

    const [kpis, orderStatuses, topProducts] = await Promise.all([
      // Query A: High-level KPIs (Total Revenue & Order Count)
      fetchQuery(`
        SELECT 
          COUNT(id) as total_orders,
          SUM(total_amount) as total_revenue
        FROM orders_bronze
        WHERE payment_status != 'failed'
      `),

      // Query B: Order Status Breakdown (For a Pie Chart)
      fetchQuery(`
        SELECT order_status, COUNT(*) as count 
        FROM orders_bronze 
        GROUP BY order_status
      `),

      // Query C: Top 5 Best-Selling Products (Joining items and products)
      fetchQuery(`
        SELECT 
          p.title, 
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.product_price) as revenue_generated
        FROM order_items_bronze oi
        JOIN products_bronze p ON oi.product_id = p.id
        GROUP BY p.title
        ORDER BY total_sold DESC
        LIMIT 5
      `)
    ]);

    // 3. Send beautifully formatted data to the frontend
    res.status(200).json({
      success: true,
      data: {
        kpis: kpis[0], // Extract the single row of KPIs
        orderStatuses,
        topProducts
      }
    });

  } catch (error) {
    console.error("❌ Databricks Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
  } finally {
    if (session) await session.close();
    // We don't close the client here so it stays alive for the next API request
  }
};