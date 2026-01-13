import { Router } from "express";
import { getCart, addItemToCart, updateItemQuantity, removeItem, clearUserCart } from "../controllers/cartController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const cartRouter = Router();

cartRouter.use(verifyToken)

cartRouter.get("/", getCart);
cartRouter.post("/add", addItemToCart);
cartRouter.put("/update", updateItemQuantity);
cartRouter.delete("/remove/:productId", removeItem);
cartRouter.delete("/clear", clearUserCart);
export default cartRouter;