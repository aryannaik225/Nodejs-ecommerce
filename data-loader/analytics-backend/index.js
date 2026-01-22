import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());

const pool = mysql.createPool({
  host: "localhost",
  port: 9030,
  user: "root",
  database: "ecommerce_analytics",

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,

  connectTimeout: 20000,
  enableKeepAlive: true,
  ssl: false,
});

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.get("/kpis", async (_, res) => {
  const [[revenue]] = await pool.query(
    "SELECT SUM(revenue) AS total_revenue FROM order_events"
  );

  const [[orders]] = await pool.query(
    "SELECT COUNT(DISTINCT order_id) AS total_orders FROM order_events"
  );

  res.json({
    totalRevenue: revenue.total_revenue || 0,
    totalOrders: orders.total_orders || 0,
  });
});

app.get("/revenue/daily", async (_, res) => {
  const [rows] = await pool.query(`
    SELECT
      DATE(event_time) AS day,
      SUM(revenue) AS revenue
    FROM order_events
    GROUP BY day
    ORDER BY day
  `);

  res.json(rows);
});

app.get("/products/top", async (_, res) => {
  const [rows] = await pool.query(`
    SELECT
      product_name,
      SUM(quantity) AS units_sold,
      SUM(revenue) AS revenue
    FROM order_events
    GROUP BY product_name
    ORDER BY revenue DESC
    LIMIT 5
  `);

  res.json(rows);
});

app.listen(5000, () => {
  console.log("Analytics backend running at http://localhost:5000");
});
