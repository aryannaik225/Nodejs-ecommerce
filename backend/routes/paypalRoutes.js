import { Router } from 'express';
import { createOrder, captureOrder } from '../controllers/paypalController.js';

const paypalRouter = Router();

paypalRouter.post('/create-order', createOrder);
paypalRouter.post('/capture-order', captureOrder);

export default paypalRouter;