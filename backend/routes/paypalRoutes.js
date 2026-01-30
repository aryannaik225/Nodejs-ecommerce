import { Router } from 'express';
import { createOrder, captureOrder } from '../controllers/paypalController.js';
import { paypalWebhook } from '../controllers/paypalWebhookController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const paypalRouter = Router();

paypalRouter.post('/create-order', verifyToken, createOrder);
paypalRouter.post('/capture-order', verifyToken, captureOrder);

paypalRouter.post('/webhook', paypalWebhook);

export default paypalRouter;