import { createPool } from 'mysql2/promise.js';
import { config } from 'dotenv';
config();

const pool = createPool({
//   port: process.env.MYSQL_PORT || 3307,
  password: process.env.MYSQL_PASSWORD || "test",
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  database: process.env.MYSQL_DATABASE_NAME || "test",
  ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
})

const connectToDatabase = async() => {
  try {
    await pool.getConnection();
    console.log("MYSQL Connection Successful")
  } catch (error) {
    console.log("Database Connection Error")
    console.log(error);
    throw error;
  }
}

export { pool, connectToDatabase };