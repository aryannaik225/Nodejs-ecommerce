import prisma from "../config/prisma.js";

export const getCartByUserId = async (userId) => {
  try {
    const cart = await prisma.cart_items.findMany({
      where: {
        user_id: userId,
      },
      include: {
        products: {
          select: {
            title: true,
            price: true,
            image: true,
            id: true,
          }
        }
      }
    });

    return cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product_id: item.product_id,
      title: item.products.title,
      price: item.products.price,
      image: item.products.image
    }));

    return cart;
  } catch (error) {
    console.log("Error fetching cart", error);
    throw error;
  }
}

export const addToCart = async (userId, productId) => {
  try {
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
      include: {
        products: true,
      },
    });
    return item;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

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