import express from 'express';
import * as controller from '../controllers/recommendationController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const recommendationRouter = express.Router();

recommendationRouter.get('/product/:id', controller.getSimilarProducts);
recommendationRouter.get('/cart', verifyToken, controller.getCartRecommendations);
recommendationRouter.get('/user', verifyToken, controller.getUserRecommendations);
recommendationRouter.post('/refresh', controller.refreshEngine);

export default recommendationRouter;