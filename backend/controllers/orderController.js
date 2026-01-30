import { createOrderTransaction, updateOrderStatus } from "../TiDB/order-queries.js";

export const createOrder = async (req, res) => {
  const userId = req.user.id;
  const { paymentMethod } = req.body; 

  try {
    const order = await createOrderTransaction(
        userId, 
        paymentMethod || 'Online',
        'paid'
    );

    return res.status(201).json({ 
      message: "Order placed successfully", 
      orderId: order.id 
    });

  } catch (error) {
    console.error("Order Creation Error:", error);
    
    if (error.message === "CART_EMPTY") {
      return res.status(400).json({ message: "Cannot place order with empty cart" });
    }

    return res.status(500).json({ message: "Failed to place order" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    const updatedOrder = await updateOrderStatus(orderId, status);
    return res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Failed to update order status" });
  }
};