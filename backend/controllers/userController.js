import User from '../models/User.js';
import bcrypt from 'bcrypt';

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'
import { validateRequiredFields } from '../utils/validateRequiredFields.js'

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('_id name email role').sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const getUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ValidationError("Invalid user ID"));
    }

    const user = await User.findById(userId).select('_id name email role').lean();
    if (!user) {
      return next(new ResourceNotFoundError('User'));
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const createUser = async (req, res, next) => {
  try {
    if (!req.body) {
        return next(new BadRequestError("Request body is missing"));
    }

    const { name, email, password, role } = req.body;
    validateRequiredFields(User, req.body); 
    
    // const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password,
      role,
    });

    await newUser.save();

    return res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }

    if (error.name === 'ValidationError') {
      return next(error);
    }

    return next(new ServerError({ message: error.message }));
  }
};

// TO DO - checking if email is still correct, also veryfication to change email on old one
export const updateUserProfile = async (req, res, next) => {
  try {
    if (!req.body) {
        return next(new BadRequestError("Request body is missing"));
    }

    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ValidationError("Invalid user ID"));
    }

    const { name, email, password } = req.body;
    const updateData = {};
    if (name?.trim()) updateData.name = name;
    if (email?.trim()) updateData.email = email;
    if (password?.trim()) updateData.password = await bcrypt.hash(password, 10);

    if (Object.keys(updateData).length === 0) {
      return next(new BadRequestError('No valid fields to update'));
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('_id name email role').lean();

    if (!user) {
      return next(new ResourceNotFoundError('User'));
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }

    return next(new ServerError({ message: error.message }));
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ValidationError("Invalid user ID"));
    }

    if (req.user._id.toString() === userId) {
      return next(new BadRequestError("Deleting your own user account is forbidden"));
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return next(new ResourceNotFoundError('User'));
    }

    return res.status(200).json({ success: true, message: `User ${deletedUser._id} deleted successfully` });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};