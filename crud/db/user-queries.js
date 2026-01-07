import { pool } from "./index.js";

export const findUserByEmail = async (email) => {
  const QUERY = "SELECT * FROM users WHERE email = ?";
  try {
    const [rows] = await pool.query(QUERY, [email]);
    return rows[0];
  } catch (error) {
    console.log("Error finding user", error);
    throw error;
  }
};

export const createUser = async (name, email, password) => {
  const QUERY = "INSERT INTO users (name, email, password) VALUES (? , ?, ?)"
  try {
    const [result] = await pool.query(QUERY, [name, email, password])
    return result;
  } catch (error) {
    console.log("Error creating user", error)
    throw error;
  }
}