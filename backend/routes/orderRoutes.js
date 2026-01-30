import { Router } from "express";
import { createOrder, updateStatus } from "../controllers/orderController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const orderRouter = Router();

orderRouter.post("/create", verifyToken, createOrder);
orderRouter.put("/update-status/:orderId", verifyToken, updateStatus);

export default orderRouter;