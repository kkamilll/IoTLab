import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getUsers, getUser, createUser, updateUserProfile, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', authMiddleware, getUsers);
router.get('/profile', authMiddleware, getUser);
router.post('/add', authMiddleware, createUser);
router.put('/profile', authMiddleware, updateUserProfile);
router.delete('/:userId', authMiddleware, deleteUser);

export default router;