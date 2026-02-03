import { Router } from 'express';
import authRouter from './authRoutes.js';
import cartRouter from './cartRoutes.js';
import couponRouter from './couponRoutes.js';
import orderRouter from './orderRoutes.js';
import paypalRouter from './paypalRoutes.js';
import productRouter from './productRoutes.js';
import redisRouter from './redisRoutes.js';

const appRouter = Router();

appRouter.use('/auth', authRouter);
appRouter.use('/', productRouter);
appRouter.use('/cart', cartRouter);
appRouter.use('/paypal', paypalRouter);
appRouter.use('/orders', orderRouter);
appRouter.use('/coupon', couponRouter)
appRouter.use('/redis', redisRouter);

export default appRouter;