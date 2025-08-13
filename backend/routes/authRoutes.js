import express from 'express';
import { login } from '../controllers/AuthController.js';
import { forgotPassword, resetPassword } from '../controllers/AuthController.js';

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;