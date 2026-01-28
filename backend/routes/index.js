import { Router } from 'express';
import authRouter from './authRoutes.js';
import productRouter from './productRoutes.js';
import cartRouter from './cartRoutes.js';
import paypalRouter from './paypalRoutes.js';
import orderRouter from './orderRoutes.js';
import couponRouter from './couponRoutes.js';

const appRouter = Router();

appRouter.use('/auth', authRouter);
appRouter.use('/', productRouter);
appRouter.use('/cart', cartRouter);
appRouter.use('/paypal', paypalRouter);
appRouter.use('/orders', orderRouter);
appRouter.use('/coupon', couponRouter)

export default appRouter;