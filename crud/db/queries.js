import { pool } from "./index.js";

export const find = async () => {
  const QUERY = "SELECT * FROM products";
  try {
    const client = await pool.getConnection();
    const result = await client.query(QUERY);
    // console.log(result);
    return result[0];
  } catch (error) {
    console.log("Error occured while finding all records. Error = ", error);
    throw error;
  }
}

export const findByID = async (id) => {
  const QUERY = "SELECT * FROM products WHERE id = ?";
  try {
    const client = await pool.getConnection();
    const result = await client.query(QUERY, [id]);
    // console.log(result);
    return result[0];
  } catch (error) {
    console.log("Error occured while finding by ID. Error = ", error);
    throw error;
  }
}

export const create = async (title, description, price, image) => {
  const QUERY = `INSERT INTO products 
        (title, description, price, image) 
        VALUES (?, ?, ?, ?)`;
  try {
    const client = await pool.getConnection();
    const result = await client.query(QUERY, [title, description, price, image]);
    // console.log(result);
    return result;
  } catch (error) {
    console.log("Error occured while creating new record. Error = ", error);
    throw error;
  }
}

export const update = async (title, description, price, id, image) => {
  const QUERY = `UPDATE products
  SET title = ?, description = ?, price = ?, image = ?
  WHERE id = ?`;
  try {
    const client = await pool.getConnection();
    const result = await client.query(QUERY, [title, description, price, image, id]);
    // console.log(result);
    return result[0];
  } catch (error) {
    console.log("Error occured while creating new record. Error = ", error);
    throw error;
  }
}

export const deletee = async (id) => {
  const QUERY = `DELETE FROM products
  WHERE id = ?`;
  try {
    const client = await pool.getConnection();
    const result = await client.query(QUERY, [ id]);
    // console.log(result);
    return result[0];
  } catch (error) {
    console.log("Error occured while creating new record. Error = ", error);
    throw error;
  }
}