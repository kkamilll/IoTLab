import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getUsers, getUser, createUser, updateUserProfile, updateUser, deleteUser } from '../controllers/userController.js';
import { filesUploadUser } from '../middleware/fileUpload.js';

const router = express.Router();

router.get('/profile', authMiddleware, getUser);
router.get('/', authMiddleware, getUsers);

router.post('/create', authMiddleware, filesUploadUser.single('profileImage'), createUser);

router.put('/profile', authMiddleware, filesUploadUser.single('profileImage'), updateUserProfile);
router.put('/:userId', authMiddleware, filesUploadUser.single('profileImage'), updateUser);

router.delete('/:userId', authMiddleware, deleteUser);

export default router;
