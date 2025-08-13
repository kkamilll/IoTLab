import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createUser, getUsers, deleteUser, getUser, updateUserProfile } from '../controllers/userController.js';

const router = express.Router();

router.post('/add', authMiddleware, createUser);
router.get('/', authMiddleware, getUsers);
router.delete('/:userId', authMiddleware, deleteUser);
router.get('/profile', authMiddleware, getUser);
router.put('/profile', authMiddleware, updateUserProfile);

export default router;