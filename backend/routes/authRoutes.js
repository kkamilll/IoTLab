import express from 'express';
import { login, forgotPassword, resetPassword } from '../controllers/AuthController.js';
import { loginLimiter, forgotPasswordLimiter, resetPasswordLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

export default router;