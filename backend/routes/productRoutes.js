import { Router } from "express";
import { createProduct, deleteProduct, getAllProducts, getProduct, updateProduct, getCategories } from "../controllers/productController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const productRouter = Router();

productRouter.get("/products", getAllProducts);
productRouter.get("/products/:id", getProduct);
productRouter.get("/categories", getCategories);

productRouter.post("/products/create", verifyToken, createProduct);
productRouter.put("/products/update/:id", verifyToken, updateProduct);
productRouter.delete("/products/delete/:id", verifyToken, deleteProduct);

export default productRouter;