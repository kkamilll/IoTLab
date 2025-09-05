import User from '../models/User.js';
import bcrypt from 'bcrypt';
import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js';
import { validateRequiredFields } from '../utils/validateRequiredFields.js';

// --- GET ALL USERS ---
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('_id name email role labRooms isActive')
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

// --- GET CURRENT USER PROFILE ---
export const getUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return next(new ValidationError("Invalid user ID"));
    const user = await User.findById(userId)
      .select('_id name email role labRooms isActive')
      .lean();
    if (!user) return next(new ResourceNotFoundError('User'));
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

// --- CREATE NEW USER ---
export const createUser = async (req, res, next) => {
  try {
    if (!req.body) return next(new BadRequestError("Request body is missing"));
    const { name, email, password, role, labRooms } = req.body;
    const newUserData = { name, email, password, role, labRooms };
    validateRequiredFields(User, newUserData);

    const newUser = new User({ ...newUserData });
    await newUser.save();

    return res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }
    if (error.name === 'ValidationError') return next(error);
    return next(new ServerError({ message: error.message }));
  }
};

// --- UPDATE CURRENT USER PROFILE ---
export const updateUserProfile = async (req, res, next) => {
  try {
    if (!req.body) return next(new BadRequestError("Request body is missing"));
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return next(new ValidationError("Invalid user ID"));

    const { name, email, password, labRooms } = req.body;
    const updateData = {};
    if (name?.trim()) updateData.name = name;
    if (email?.trim()) updateData.email = email;
    if (password?.trim()) updateData.password = await bcrypt.hash(password, 10);
    if (Array.isArray(labRooms)) updateData.labRooms = labRooms;

    if (Object.keys(updateData).length === 0) return next(new BadRequestError('No valid fields to update'));

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('_id name email role isActive').lean();

    if (!user) return next(new ResourceNotFoundError('User'));

    return res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }
    return next(new ServerError({ message: error.message }));
  }
};

// --- UPDATE ANY USER (ADMIN) ---
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return next(new ValidationError("Invalid user ID"));

    const { name, email, password, role, labRooms } = req.body;
    const updateData = {};
    if (name?.trim()) updateData.name = name;
    if (email?.trim()) updateData.email = email;
    if (password?.trim()) updateData.password = await bcrypt.hash(password, 10);
    if (role?.trim()) updateData.role = role;
    if (Array.isArray(labRooms)) updateData.labRooms = labRooms;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('_id name email role labRooms isActive').lean();

    if (!updatedUser) return next(new ResourceNotFoundError('User'));

    return res.status(200).json({ success: true, message: "User updated successfully", user: updatedUser });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }
    return next(new ServerError({ message: error.message }));
  }
};

// --- DELETE USER ---
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return next(new ValidationError("Invalid user ID"));
    if (req.user._id.toString() === userId) return next(new BadRequestError("Deleting your own user account is forbidden"));

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return next(new ResourceNotFoundError('User'));

    return res.status(200).json({ success: true, message: `User ${deletedUser._id} deleted successfully` });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

// --- TOGGLE ACTIVE STATUS ---
export const toggleUserActive = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return next(new ValidationError("Invalid user ID"));

    const user = await User.findById(userId);
    if (!user) return next(new ResourceNotFoundError('User'));

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ success: true, isActive: user.isActive });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password?.trim()) {
      return next(new BadRequestError("Email and password are required"));
    }

    const user = await User.findOne({ email });
    if (!user) return next(new ResourceNotFoundError("User"));

    // SPRAWDZENIE CZY KONTO JEST AKTYWNE
    if (!user.isActive) {
      return next(new BadRequestError("This account is deactivated. Contact admin."));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new ValidationError("Invalid email or password"));

    const tokenPayload = { _id: user._id, role: user.role };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        labRooms: user.labRooms,
        isActive: user.isActive
      }
    });
  } catch (error) {
    return next(error);
  }
};