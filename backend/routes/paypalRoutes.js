import { Router } from 'express';
import { createOrder, captureOrder } from '../controllers/paypalController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const paypalRouter = Router();

paypalRouter.post('/create-order', createOrder);
paypalRouter.post('/capture-order', verifyToken, captureOrder);

export default paypalRouter;