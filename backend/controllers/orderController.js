import { createOrderTransaction, getOrdersWithStatusSimulation, updateOrderStatus } from "../TiDB/order-queries.js";
import { runDatabricksPipeline } from "../Databricks/scripts/databricksPipeline.js";

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

export const updateStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    const updatedOrder = await updateOrderStatus(orderId, status);

    runDatabricksPipeline(orderId).catch(console.error)

    return res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Failed to update order status" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await getOrdersWithStatusSimulation(userId);
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
}