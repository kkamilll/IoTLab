import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getUsers, getUser, createUser, updateUserProfile, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', authMiddleware, getUsers);
router.get('/profile', authMiddleware, getUser);
router.post('/create', authMiddleware, createUser);
router.put('/profile', authMiddleware, updateUserProfile); // dla zalogowanego usera
router.put('/:userId', authMiddleware, updateUser); // dla admina do edycji dowolnego usera
router.delete('/:userId', authMiddleware, deleteUser);

export default router;
