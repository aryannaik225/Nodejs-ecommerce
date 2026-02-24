import { Router } from "express";
import { getKpis, getTopProducts } from "../controllers/analyticsController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const analyticsRouter = Router();

analyticsRouter.use(verifyToken)

analyticsRouter.get("/kpis", getKpis);
analyticsRouter.get("/products/top", getTopProducts);

export default analyticsRouter;