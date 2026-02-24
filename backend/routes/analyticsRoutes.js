import { Router } from "express";
import { getDashboardData } from "../controllers/analyticsController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const analyticsRouter = Router();

analyticsRouter.use(verifyToken)

analyticsRouter.get("/dashboard", getDashboardData)

export default analyticsRouter;