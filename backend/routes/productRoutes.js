import { Router } from "express";
import { createProduct, deleteProduct, getAllProducts, getProduct, updateProduct, getCategories, manageStock, selectProductCategoriess, selectProductss } from "../controllers/productController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const productRouter = Router();

productRouter.get("/products", getAllProducts);
productRouter.get("/products/:id", getProduct);
productRouter.get("/categories", getCategories);

productRouter.post("/products/create", verifyToken, createProduct);
productRouter.put("/products/update/:id", verifyToken, updateProduct);
productRouter.delete("/products/delete/:id", verifyToken, deleteProduct);

productRouter.post("/products/stock", verifyToken, manageStock);

productRouter.get("/products/select-categories", selectProductCategoriess);
productRouter.get("/products/select-products", selectProductss);

export default productRouter;