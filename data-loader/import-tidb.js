require('dotenv').config()
const mysql = require('mysql2/promise')
const { Kafka } = require('kafkajs')

const KAFKA_TOPIC = 'ecommerce_final_v1'
const POLL_INTERVAL = 5000

const kafka = new Kafka({ clientId: 'tidb-bridge', brokers: ['localhost:9092'] })
const producer = kafka.producer()

let lastSyncedOrderId = 0

const syncData = async () => {

  // Connecting to the TiDB database
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
    }
  })

  try {
    await producer.connect()
    console.log("Connected to Kafka & TiDB. Waiting for new orders...")

    while (true) {
      const [rows] = await connection.execute(
                `SELECT 
                    o.id as order_id, 
                    o.user_id, 
                    p.title as product_name, 
                    o.amount, 
                    o.created_at 
                 FROM orders o
                 JOIN products p ON o.product_id = p.id
                 WHERE o.id > ? 
                 ORDER BY o.id ASC 
                 LIMIT 10`,
                [lastSyncedOrderId]
            );

      if (rows.length > 0) {
        console.log(`Found ${rows.length} new orders in TiDB!`)

        for (const row of rows) {
          const cleanEvent = {
            order_id: row.order_id,
            user_id: row.user_id,
            product_name: row.product_name,
            amount: parseFloat(row.amount),
            event_time: new Date(row.created_at).toISOString().slice(0, 19).replace('T', ' '),
          }

          await producer.send({
            topic: KAFKA_TOPIC,
            messages: [{ value: JSON.stringify(cleanEvent) }],
          })

          console.log(`   -> Sent Order #${cleanEvent.order_id}`)
          lastSyncedOrderId = row.order_id
        }
      }
      await new Promise(r => setTimeout(r, POLL_INTERVAL))
    }
  } catch (err) {
    console.error("Error in sync process:", err.message)
  } finally {
    await connection.end()
    await producer.disconnect()
  }
}

syncData()