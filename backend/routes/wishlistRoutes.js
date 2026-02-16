import express from 'express';
import { toggleWishlist, getWishlistIds, getWishlistProducts } from '../controllers/wishlistController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/toggle', verifyToken, toggleWishlist);
wishlistRouter.get('/ids', verifyToken, getWishlistIds);
wishlistRouter.get('/', verifyToken, getWishlistProducts);

export default wishlistRouter;