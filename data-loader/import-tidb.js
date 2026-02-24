require("dotenv").config();
const mysql = require("mysql2/promise");
const { Kafka } = require("kafkajs");
const fs = require("fs").promises; // 1. Added the File System module

const KAFKA_TOPIC = "ecommerce_orders_v1";
const POLL_INTERVAL = 5000;
const STATE_FILE = "sync-state.json"; // 2. Define where we save our state

const kafka = new Kafka({
  clientId: "tidb-orders-loader",
  brokers: ["localhost:9094"],
});

const producer = kafka.producer();

// 3. Helper function to read the last saved ID
async function getLastId() {
  try {
    const data = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(data).lastId;
  } catch (err) {
    return 0; // If the file doesn't exist yet, start at 0
  }
}

// 4. Helper function to save the new ID
async function saveLastId(id) {
  await fs.writeFile(STATE_FILE, JSON.stringify({ lastId: id }));
}

async function syncOrders() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  });

  await producer.connect();
  console.log("✅ Connected to TiDB & Kafka");

  // 5. Load the ID from the file when the script starts
  let lastSyncedOrderItemId = await getLastId();
  console.log(`🚀 Resuming sync from order_item_id: ${lastSyncedOrderItemId}`);

  while (true) {
    const [rows] = await connection.execute(
      `
      SELECT
        oi.id               AS order_item_id,
        o.id                AS order_id,
        o.user_id,
        oi.product_id,
        oi.product_title    AS product_name,
        oi.quantity,
        oi.product_price    AS price,
        (oi.quantity * oi.product_price) AS revenue,
        o.created_at
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.id > ?
      ORDER BY oi.id ASC
      LIMIT 100
      `,
      [lastSyncedOrderItemId]
    );

    if (rows.length > 0) {
      console.log(`📦 ${rows.length} new order items pulled`);

      for (const row of rows) {
        const event = {
          order_item_id: row.order_item_id,
          order_id: row.order_id,
          user_id: row.user_id,
          product_id: row.product_id,
          product_name: row.product_name,
          quantity: row.quantity,
          price: row.price,
          revenue: row.revenue,
          event_time: new Date(row.created_at)
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
        };

        await producer.send({
          topic: KAFKA_TOPIC,
          messages: [{ value: JSON.stringify(event) }],
        });

        lastSyncedOrderItemId = row.order_item_id;
      }

      // 6. Save the state after successfully sending the batch to Redpanda
      await saveLastId(lastSyncedOrderItemId);
      console.log(`💾 Checkpoint saved: last_id is now ${lastSyncedOrderItemId}`);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
}

syncOrders().catch(console.error);