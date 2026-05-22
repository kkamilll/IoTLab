import User from "../models/User.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import Product from "../models/Product.js";
import {
  AppError,
  ValidationError,
  BadRequestError,
  DuplicateKeyError,
  ResourceNotFoundError,
  ServerError,
} from "../errors/CustomErrors.js";
// import { validateRequiredFields } from '../utils/validateRequiredFields.js'

// Get all users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("_id name email role labRooms isActive")
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

// Get current user profile
export const getUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ValidationError("Invalid user ID"));
    }
    const user = await User.findById(userId)
      .select("_id name email role labRooms isActive")
      .lean();
    if (!user) return next(new ResourceNotFoundError("User"));
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

// Create new user
export const createUser = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0)
      return next(new BadRequestError("Request body is missing"));
    const { name, email, password, role, labRooms, isActive } = req.body;
    const newUserData = { name, email, password, role, labRooms, isActive };
    // validateRequiredFields(User, newUserData);

    const newUser = new User({ ...newUserData });
    await newUser.save();

    return res
      .status(201)
      .json({ success: true, message: "User created successfully" });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }

    if (error instanceof AppError) return next(error);
    if (error.name === "ValidationError") {
      return next(
        new BadRequestError("Missing or invalid fields", error.errors),
      );
    }

    return next(new ServerError({ message: error.message }));
  }
};

// Update user profile (for current user)
export const updateUserProfile = async (req, res, next) => {
  try {
    if (!req.body) return next(new BadRequestError("Request body is missing"));

    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return next(new ValidationError("Invalid user ID"));

    const { name, email, password, labRooms } = req.body;
    const updateData = {};
    if (name?.trim()) updateData.name = name;
    if (email?.trim()) updateData.email = email;
    if (password?.trim()) updateData.password = await bcrypt.hash(password, 10);
    if (Array.isArray(labRooms)) updateData.labRooms = labRooms;

    if (Object.keys(updateData).length === 0)
      return next(new BadRequestError("No valid fields to update"));

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("_id name email role isActive")
      .lean();
    if (!user) return next(new ResourceNotFoundError("User"));

    return res
      .status(200)
      .json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }
    return next(new ServerError({ message: error.message }));
  }
};

// Update any user (admin)
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return next(new ValidationError("Invalid user ID"));

    const { name, email, password, role, labRooms, isActive } = req.body;
    const updateData = {};
    if (name?.trim()) updateData.name = name;
    if (email?.trim()) updateData.email = email;
    if (password?.trim()) updateData.password = await bcrypt.hash(password, 10);
    if (role?.trim()) updateData.role = role;
    if (Array.isArray(labRooms)) updateData.labRooms = labRooms;
    if (typeof isActive === "boolean") updateData.isActive = isActive; // nowy stan konta

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("_id name email role labRooms isActive")
      .lean();
    if (!updatedUser) return next(new ResourceNotFoundError("User"));

    return res
      .status(200)
      .json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }
    return next(new ServerError({ message: error.message }));
  }
};

// Delete user
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return next(new ValidationError("Invalid user ID"));

    if (req.user._id.toString() === userId)
      return next(
        new BadRequestError("Deleting your own user account is forbidden"),
      );

    // Sprawdź, czy użytkownik posiada jakieś produkty
    const products = await Product.find({ owner: userId });
    if (products.length > 0) {
      return next(
        new BadRequestError(
          "Cannot delete user: they have associated products",
        ),
      );
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return next(new ResourceNotFoundError("User"));

    return res
      .status(200)
      .json({
        success: true,
        message: `User ${deletedUser._id} deleted successfully`,
      });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};
