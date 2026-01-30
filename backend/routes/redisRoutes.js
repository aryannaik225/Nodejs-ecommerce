import {Router} from 'express';
import { saveCheckoutState, clearCheckoutState, loadCheckoutState } from '../controllers/redisController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const redisRouter = Router();

redisRouter.post('/', verifyToken, saveCheckoutState);
redisRouter.get('/:key', verifyToken, loadCheckoutState);
redisRouter.delete('/:key', verifyToken, clearCheckoutState);

export default redisRouter;