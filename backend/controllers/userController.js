import User from "../models/User.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import fs from "fs";
import path from "path";
import {
  AppError,
  ValidationError,
  BadRequestError,
  DuplicateKeyError,
  ResourceNotFoundError,
  ServerError,
} from "../errors/CustomErrors.js";

const deleteProfileImageFile = (filename) => {
  if (!filename) return;
  const filePath = path.join("uploads", "users", filename);
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting user profile image file:", err);
  });
};
// import { validateRequiredFields } from '../utils/validateRequiredFields.js'

// Get all users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("_id name email role labRooms isActive profileImage")
      .sort({ name: 1 })
      .lean();

    // Fetch product counts grouped by owner
    const productCounts = await Product.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$owner", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    productCounts.forEach(item => {
      if (item._id) {
        countMap[item._id.toString()] = item.count;
      }
    });

    // Fetch active order counts grouped by responsible owner
    const activeOrderCounts = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": { $in: ["pending", "approved", "prepared", "rented"] } } },
      { $group: { _id: "$items.responsibleOwner", count: { $sum: 1 } } }
    ]);

    const orderCountMap = {};
    activeOrderCounts.forEach(item => {
      if (item._id) {
        orderCountMap[item._id.toString()] = item.count;
      }
    });

    const usersWithStats = users.map(u => ({
      ...u,
      productCount: countMap[u._id.toString()] || 0,
      activeOrderCount: orderCountMap[u._id.toString()] || 0
    }));

    return res.status(200).json({ success: true, users: usersWithStats });
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
      .select("_id name email role labRooms isActive profileImage")
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
    const { name, email, password, role, labRooms, isActive } = req.body;

    const activeState = isActive === undefined ? true : (isActive === "true" || isActive === true);
    if (role === "admin" && !activeState) {
      const isPl = req.headers["accept-language"]?.includes("pl");
      return next(
        new BadRequestError(
          isPl
            ? "Konto administratora musi być aktywne"
            : "An admin account must be active"
        )
      );
    }
    
    let parsedLabRooms = [];
    if (labRooms) {
      if (typeof labRooms === "string") {
        try {
          parsedLabRooms = JSON.parse(labRooms);
        } catch (e) {
          parsedLabRooms = labRooms.split(",").map(r => r.trim());
        }
      } else if (Array.isArray(labRooms)) {
        parsedLabRooms = labRooms;
      }
    }

    const newUserData = {
      name,
      email,
      password,
      role,
      labRooms: parsedLabRooms,
      isActive: activeState
    };

    if (req.file) {
      newUserData.profileImage = req.file.filename;
    }

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
    
    if (labRooms) {
      if (typeof labRooms === "string") {
        try {
          updateData.labRooms = JSON.parse(labRooms);
        } catch (e) {
          updateData.labRooms = labRooms.split(",").map(r => r.trim());
        }
      } else if (Array.isArray(labRooms)) {
        updateData.labRooms = labRooms;
      }
    }

    if (req.file) {
      updateData.profileImage = req.file.filename;
      const currentUser = await User.findById(userId);
      if (currentUser && currentUser.profileImage) {
        deleteProfileImageFile(currentUser.profileImage);
      }
    }

    if (Object.keys(updateData).length === 0)
      return next(new BadRequestError("No valid fields to update"));

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("_id name email role isActive profileImage")
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

    const targetUser = await User.findById(userId);
    if (!targetUser) return next(new ResourceNotFoundError("User"));

    const { name, email, password, role, labRooms, isActive } = req.body;
    const updateData = {};
    if (name?.trim()) updateData.name = name;
    if (email?.trim()) updateData.email = email;
    if (password?.trim()) updateData.password = await bcrypt.hash(password, 10);
    if (role?.trim()) updateData.role = role;
    
    if (labRooms) {
      if (typeof labRooms === "string") {
        try {
          updateData.labRooms = JSON.parse(labRooms);
        } catch (e) {
          updateData.labRooms = labRooms.split(",").map(r => r.trim());
        }
      } else if (Array.isArray(labRooms)) {
        updateData.labRooms = labRooms;
      }
    }
    
    const newRole = role || targetUser.role;
    const activeState = isActive !== undefined ? (isActive === "true" || isActive === true) : targetUser.isActive;
    const isPl = req.headers["accept-language"]?.includes("pl");

    // 1. Check if disabling own account
    if (!activeState && req.user._id.toString() === userId) {
      return next(
        new BadRequestError(
          isPl
            ? "Dezaktywacja własnego konta jest zabroniona"
            : "Deactivating your own account is forbidden"
        )
      );
    }

    // 2. Check if admin account would be inactive
    if (newRole === "admin" && !activeState) {
      if (isActive !== undefined && (isActive === "false" || isActive === false || activeState === false)) {
        return next(
          new BadRequestError(
            isPl
              ? "Nie można wyłączyć konta administratora"
              : "Deactivating an admin account is forbidden"
          )
        );
      } else {
        return next(
          new BadRequestError(
            isPl
              ? "Konto administratora musi być aktywne"
              : "An admin account must be active"
          )
        );
      }
    }

    if (isActive !== undefined) {
      updateData.isActive = activeState;
    }

    if (req.file) {
      updateData.profileImage = req.file.filename;
      if (targetUser.profileImage) {
        deleteProfileImageFile(targetUser.profileImage);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("_id name email role labRooms isActive profileImage")
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

    if (req.user._id.toString() === userId) {
      const isPl = req.headers["accept-language"]?.includes("pl");
      return next(
        new BadRequestError(
          isPl
            ? "Usuwanie własnego konta jest zabronione"
            : "Deleting your own user account is forbidden"
        )
      );
    }

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
    if (deletedUser.profileImage) {
      deleteProfileImageFile(deletedUser.profileImage);
    }

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
