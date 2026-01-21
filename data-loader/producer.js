const { Kafka } = require('kafkajs')
const fs = require('fs')
const csv = require('csv-parser')
const path = require('path')

// Connecting to Local Kafka (Redpanda)
const kafka = new Kafka({
  clientId: 'ecommerce-loader',
  brokers: ['localhost:9092'],
})

const producer = kafka.producer()
const TOPIC = 'ecommerce_final_v1'

const processFile = async() => {
  await producer.connect()
  console.log('Connected to Kafka as producer')

  const results = []

  fs.createReadStream(path.join(__dirname, 'transactions.csv'))
    .pipe(csv())
    .on('data', (data) => {
      
      const cleanRow = {
        order_id: parseInt(data.order_id),
        user_id: parseInt(data.user_id),
        product_name: data.product_name,
        amount: parseFloat(data.amount),
        event_time: data.event_time,
      }
      results.push(cleanRow)
    })
    .on('end', async() => {
      console.log(`Found ${results.length} rows. Sending to Kafka...`)

      for (const row of results) {
        console.log("Sending payload:", JSON.stringify(row))
        await producer.send({
          topic: TOPIC,
          messages: [
            { value: JSON.stringify(row) }
          ],
        })
        console.log(`   -> Sent Order #${row.order_id}`)
      }

      console.log('All messages sent.')
      await producer.disconnect()
    })
}

processFile().catch(console.error)
