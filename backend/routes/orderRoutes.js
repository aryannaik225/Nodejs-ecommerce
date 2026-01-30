import { Router } from "express";
import { createOrder, updateOrderStatus } from "../controllers/orderController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const orderRouter = Router();

orderRouter.post("/create", verifyToken, createOrder);
orderRouter.put("/update-status/:orderId", verifyToken, updateOrderStatus);

export default orderRouter;