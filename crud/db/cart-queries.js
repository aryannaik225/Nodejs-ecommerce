import { pool } from "./index.js";
import prisma from "./prisma.js";

// export const getCartByUserId = async (userId) => {
//   const QUERY = `
//     SELECT c.id, c.quantity, p.title, p.price, p.image, p.id as product_id
//     FROM cart_items c
//     JOIN products p ON c.product_id = p.id
//     WHERE c.user_id = ?
//   `;
//   try {
//     const [rows] = await pool.query(QUERY, [userId]);
//     return rows;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }

export const getCartByUserId = async (userId) => {
  try {
    const cart = await prisma.cart_items.findMany({
      where: { user_id: userId },
      include: {
        products: true,
      },
    })
    return cart;
  } catch (error) {
    console.log("Error fetching cart", error);
    throw error;
  }
}

// export const addToCart = async (userId, productId) => {
//   const QUERY = `
//     INSERT INTO cart_items (user_id, product_id, quantity)
//     VALUES (?, ?, 1)
//     ON DUPLICATE KEY UPDATE quantity = quantity + 1
//   `;
//   try {
//     const [result] = await pool.query(QUERY, [userId, productId]);
//     return result;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }

export const addToCart = async (userId, productId) => {
  try {
    // const existingItem = await prisma.cart_items.findUnique({
    //   where: {
    //     user_id_product_id: {
    //       user_id: userId,
    //       product_id: productId,
    //     },
    //   },
    // });
    // if (existingItem) {
    //   const updatedItem = await prisma.cart_items.update({
    //     where: {
    //       user_id_product_id: {
    //         user_id: userId,
    //         product_id: productId,
    //       },
    //     },
    //     data: {
    //       quantity: existingItem.quantity + 1,
    //     },
    //   });
    //   return updatedItem;
    // } else {
    //   const newItem = await prisma.cart_items.create({
    //     data: {
    //       user_id: userId,
    //       product_id: productId,
    //       quantity: 1,
    //     },
    //   });
    //   return newItem;
    // }

    const item = await prisma.cart_items.upsert({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
      update: {
        quantity: { increment: 1 },
      },
      create: {
        user_id: userId,
        product_id: productId,
        quantity: 1,
      },
    });
    return item;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// export const updateCartQuantity = async (userId, productId, quantity) => {
//   const QUERY = "UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?";
//   try {
//     const [result] = await pool.query(QUERY, [quantity, userId, productId]);
//     return result;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }

export const updateCartQuantity = async (userId, productId, quantity) => {
  try {
    const updatedItem = await prisma.cart_items.update({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
      data: {
        quantity: quantity,
      },
    });
    return updatedItem;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// export const removeFromCart = async (userId, productId) => {
//   const QUERY = "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?";
//   try {
//     const [result] = await pool.query(QUERY, [userId, productId]);
//     return result;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }

export const removeFromCart = async (userId, productId) => {
  try {
    const deletedItem = await prisma.cart_items.delete({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
    });
    return deletedItem;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// export const clearCart = async (userId) => {
//   const QUERY = "DELETE FROM cart_items WHERE user_id = ?";
//   try {
//     const [result] = await pool.query(QUERY, [userId]);
//     return result;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }

export const clearCart = async (userId) => {
  try {
    const deletedItems = await prisma.cart_items.deleteMany({
      where: { user_id: userId },
    });
    return deletedItems;
  } catch (error) {
    console.log(error);
    throw error;
  }
}