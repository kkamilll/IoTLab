import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getUsers, getUser, createUser, updateUserProfile, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', authMiddleware, getUser);
router.get('/', authMiddleware, getUsers);

router.post('/create', authMiddleware, createUser);

router.put('/profile', authMiddleware, updateUserProfile);
router.put('/:userId', authMiddleware, updateUser);

router.delete('/:userId', authMiddleware, deleteUser);

export default router;
