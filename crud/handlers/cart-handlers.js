import { getCartByUserId, addToCart, updateCartQuantity, removeFromCart } from "../db/cart-queries.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT
    const cart = await getCartByUserId(userId);
    return res.status(200).json({ cart });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error fetching cart" });
  }
};

export const addItemToCart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;
  try {
    await addToCart(userId, productId);
    return res.status(200).json({ message: "Added to cart" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error adding to cart" });
  }
};

export const updateItemQuantity = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;
  try {
    if (quantity < 1) {
      await removeFromCart(userId, productId);
    } else {
      await updateCartQuantity(userId, productId, quantity);
    }
    return res.status(200).json({ message: "Cart updated" });
  } catch (error) {
    return res.status(500).json({ message: "Error updating cart" });
  }
};

export const removeItem = async (req, res) => {
  const productId = req.params.productId;
  const userId = req.user.id;
  try {
    await removeFromCart(userId, productId);
    return res.status(200).json({ message: "Item removed" });
  } catch (error) {
    return res.status(500).json({ message: "Error removing item" });
  }
};