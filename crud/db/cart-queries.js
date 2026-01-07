import { pool } from "./index.js";

export const getCartByUserId = async (userId) => {
  const QUERY = `
    SELECT c.id, c.quantity, p.title, p.price, p.image, p.id as product_id
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  try {
    const [rows] = await pool.query(QUERY, [userId]);
    return rows;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const addToCart = async (userId, productId) => {
  const QUERY = `
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (?, ?, 1)
    ON DUPLICATE KEY UPDATE quantity = quantity + 1
  `;
  try {
    const [result] = await pool.query(QUERY, [userId, productId]);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const updateCartQuantity = async (userId, productId, quantity) => {
  const QUERY = "UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?";
  try {
    const [result] = await pool.query(QUERY, [quantity, userId, productId]);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const removeFromCart = async (userId, productId) => {
  const QUERY = "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?";
  try {
    const [result] = await pool.query(QUERY, [userId, productId]);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}