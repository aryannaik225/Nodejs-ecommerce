const { Kafka } = require('kafkajs')

const kafka = new Kafka({ clientId: 'test-loader', brokers: ['localhost:9092'] })
const producer = kafka.producer()

const TOPIC = 'ecommerce_live_v1'

const run = async () => {
  await producer.connect()
  console.log('Connected to Kafka as test producer')

  const manualRow = {
    order_id: 8888,
    user_id: 1,
    product_name: 'Test Manual Item',
    amount: 99.99,
    event_time: "2024-01-01 10:00:00",
  }

  console.log("Sending:", JSON.stringify(manualRow))

  await producer.send({
    topic: TOPIC,
    messages: [{ value: JSON.stringify(manualRow) }],
  })

  console.log('Sent!')
  await producer.disconnect()
}

run().catch(console.error)