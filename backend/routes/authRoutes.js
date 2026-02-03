import { Router } from 'express';
import { login, signup, refresh, logout } from '../controllers/authController.js';

const authRouter = Router();

authRouter.post('/signup', signup)
authRouter.post('/login', login)
authRouter.post('/refresh', refresh)
authRouter.post('/logout', logout)

export default authRouter;