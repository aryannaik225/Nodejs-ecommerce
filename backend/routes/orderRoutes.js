import { Router } from "express";
import { createOrder } from "../controllers/orderController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const orderRouter = Router();

orderRouter.post("/create", verifyToken, createOrder);

export default orderRouter;