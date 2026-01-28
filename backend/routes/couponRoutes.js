import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { createNewCoupon, getCoupons, getCouponByCodeController, validateCoupon, updateCouponController, incrementCouponUsageController, deleteCouponController, getActiveCouponsController, getExpiredCouponsController } from '../controllers/couponController.js';

const couponRouter = Router();

couponRouter.post('/create', verifyToken, createNewCoupon);
couponRouter.get('/', verifyToken, getCoupons);
couponRouter.get('/active', getActiveCouponsController);
couponRouter.get('/expired', getExpiredCouponsController);
couponRouter.get('/:code', getCouponByCodeController);
couponRouter.post('/validate', verifyToken, validateCoupon);
couponRouter.put('/update/:id', verifyToken, updateCouponController);
couponRouter.post('/increment-usage/:id', verifyToken, incrementCouponUsageController);
couponRouter.delete('/delete/:id', verifyToken, deleteCouponController);

export default couponRouter;