import express from 'express';
import appRouter from './routes/index.js';
import { config } from 'dotenv';
import { connectToDatabase } from './db/index.js';
import cors from 'cors';

// docker run --name sqldb -d -p 3307:3306 --rm -v mysqldata:/var/lib/mysql -e MYSQL_ROOT_PASSWORD='test' mysql:8.0
// mysql -u root -ptest
// use ecom

const app = express();
config();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

app.use("/api/v1", appRouter);

const PORT = process.env.PORT || 5000;

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.log("Error occured with mysql connection. Error = ", error);
    process.exit(1);
  })