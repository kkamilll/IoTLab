import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationCode } from "../utils/sendEmail.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { AppError, ValidationError, BadRequestError, ServerError } from '../errors/CustomErrors.js'
// import { validateRequiredFields } from '../utils/validateRequiredFields.js'

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const login = async (req, res, next) => {
  try {
    if (!req.body) {
      return next(new BadRequestError("Request body is missing"));
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Konto jest zablokowane" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    if (!req.body) {
      return next(new BadRequestError("Request body is missing"));
    }

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpCode = generateOtp();
    user.resetPasswordOtp = otpCode;
    user.resetPasswordOtpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendVerificationCode(otpCode, user.email, res);
    return res.status(200).json({ success: true, message: "Verification Code sent to email" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    if (!req.body) {
      return next(new BadRequestError("Request body is missing"));
    }
    
    const { email, otpCode, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (
      !user.resetPasswordOtp ||
      user.resetPasswordOtp !== otpCode ||
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires < Date.now()
    ) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Password has been successfully changed" });
  } catch (error) {
    next(error);
  }
};
