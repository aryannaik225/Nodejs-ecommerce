import { Router } from 'express';
import authRouter from './authRoutes.js';
import productRouter from './productRoutes.js';
import cartRouter from './cartRoutes.js';
import paypalRouter from './paypalRoutes.js';

const appRouter = Router();

appRouter.use('/auth', authRouter);
appRouter.use('/', productRouter);
appRouter.use('/cart', cartRouter);
appRouter.use('/paypal', paypalRouter);

export default appRouter;