import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { getUsers, getUser, createUser, updateUserProfile, updateUser, deleteUser } from '../controllers/userController.js';
import { filesUploadUser } from '../middleware/fileUpload.js';

const router = express.Router();

router.get('/profile', authMiddleware, getUser);
router.get('/', authMiddleware, adminOnly, getUsers);

router.post('/create', authMiddleware, adminOnly, filesUploadUser.single('profileImage'), createUser);

router.put('/profile', authMiddleware, filesUploadUser.single('profileImage'), updateUserProfile);
router.put('/:userId', authMiddleware, adminOnly, filesUploadUser.single('profileImage'), updateUser);

router.delete('/:userId', authMiddleware, adminOnly, deleteUser);

export default router;
