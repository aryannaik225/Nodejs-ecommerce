import { Router } from 'express';
import { createProduct, deleteProduct, getAllProducts, getProduct, updateProduct } from '../handlers/index.js';
import { login, signup } from '../handlers/user-handlers.js';
import { getCart, addItemToCart, updateItemQuantity, removeItem, clearUserCart } from '../handlers/cart-handlers.js';
import { verifyToken } from '../utils/auth-middleware.js';

const appRouter = Router();

// appRouter.use((req, res, next) => {
//   console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
//   next();
// });

appRouter.get('/products', getAllProducts)
appRouter.get('/products/:id', getProduct)

appRouter.post('/auth/signup', signup)
appRouter.post('/auth/login', login)

appRouter.post('/products/create', verifyToken, createProduct)
appRouter.put('/products/update/:id', verifyToken, updateProduct)
appRouter.delete('/products/delete/:id', verifyToken, deleteProduct)

appRouter.get('/cart', verifyToken, getCart);
appRouter.post('/cart/add', verifyToken, addItemToCart);
appRouter.put('/cart/update', verifyToken, updateItemQuantity);
appRouter.delete('/cart/remove/:productId', verifyToken, removeItem);
appRouter.delete('/cart/clear', verifyToken, clearUserCart);

export default appRouter;