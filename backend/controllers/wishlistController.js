import prisma from "../config/prisma.js";

// Toggle Wishlist Item (Add/Remove)
export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID required" });
    }

    // Check if exists
    const existingItem = await prisma.wishlist_items.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: parseInt(productId),
        },
      },
    });

    if (existingItem) {
      // Remove
      await prisma.wishlist_items.delete({
        where: { id: existingItem.id },
      });
      return res.json({ success: true, action: "removed", message: "Removed from wishlist" });
    } else {
      // Add
      await prisma.wishlist_items.create({
        data: {
          user_id: userId,
          product_id: parseInt(productId),
        },
      });
      return res.json({ success: true, action: "added", message: "Added to wishlist" });
    }
  } catch (error) {
    console.error("Wishlist Toggle Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get User's Wishlist Product IDs (for the Heart icon state)
export const getWishlistIds = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const items = await prisma.wishlist_items.findMany({
      where: { user_id: userId },
      select: { product_id: true }
    });

    const ids = items.map(item => item.product_id);
    
    res.json({ success: true, ids });
  } catch (error) {
    console.error("Wishlist Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Full Wishlist Products (For the Wishlist Page)
export const getWishlistProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const items = await prisma.wishlist_items.findMany({
      where: { user_id: userId },
      include: {
        products: true // Include full product details
      }
    });

    // Flatten structure so frontend receives a list of products
    const products = items.map(item => item.products);
    
    res.json({ success: true, products });
  } catch (error) {
    console.error("Wishlist Page Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};