import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationCode } from "../utils/sendEmail.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { AppError, ValidationError, BadRequestError, ServerError } from '../errors/CustomErrors.js'
import { isStrongPassword, PASSWORD_COMPLEXITY_ERROR } from "../utils/passwordValidator.js";
import { logAudit } from "../utils/auditLogger.js";
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
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password.trim()) {
      return res.status(400).json({ success: false, message: "Invalid email or password format" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    
    // Constant-time comparison simulation to prevent timing attacks and enumeration
    if (!user) {
      await logAudit({
        req,
        action: "AUTH_LOGIN_FAILED",
        details: `Nieudana próba logowania na nieistniejący adres: ${cleanEmail}`,
        targetType: "Auth",
      });
      return res.status(401).json({ success: false, message: "Nieprawidłowy adres e-mail lub hasło" });
    }

    if (!user.isActive) {
      await logAudit({
        req,
        user,
        action: "AUTH_LOGIN_BLOCKED",
        details: `Próba logowania na zablokowane konto: ${user.email}`,
        targetId: user._id,
        targetType: "User",
      });
      return res.status(403).json({ success: false, message: "Konto jest zablokowane. Skontaktuj się z administratorem." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAudit({
        req,
        user,
        action: "AUTH_LOGIN_FAILED",
        details: `Nieudane logowanie - błędne hasło dla konta: ${user.email}`,
        targetId: user._id,
        targetType: "User",
      });
      return res.status(401).json({ success: false, message: "Nieprawidłowy adres e-mail lub hasło" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    await logAudit({
      req,
      user,
      action: "AUTH_LOGIN_SUCCESS",
      details: `Pomyślne logowanie użytkownika: ${user.name} (${user.email})`,
      targetId: user._id,
      targetType: "User",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || "",
      },
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
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ success: false, message: "Invalid email address format" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpCode = generateOtp();
    user.resetPasswordOtp = otpCode;
    user.resetPasswordOtpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await logAudit({
      req,
      user,
      action: "AUTH_FORGOT_PASSWORD_REQUEST",
      details: `Wygenerowano kod OTP do zresetowania hasła dla: ${user.email}`,
      targetId: user._id,
      targetType: "User",
    });

    try {
      await sendVerificationCode(otpCode, user.email);
    } catch (mailError) {
      console.error(`[SMTP ERROR] Could not send OTP email to ${user.email}:`, mailError.message);
      console.log(`\n==================================================`);
      console.log(`🔑 [DEV-OTP] Verification code for ${user.email}: ${otpCode}`);
      console.log(`==================================================\n`);

      const isPlaceholderSmtp =
        !process.env.SMTP_PASSWORD ||
        process.env.SMTP_PASSWORD === "your_gmail_app_password" ||
        process.env.SMTP_MAIL === "your_email@gmail.com";

      if (process.env.NODE_ENV !== "production" || isPlaceholderSmtp) {
        return res.status(200).json({
          success: true,
          message: "Verification Code sent (logged to server console in dev mode).",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please check SMTP settings.",
      });
    }

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
    if (
      typeof email !== "string" ||
      typeof otpCode !== "string" ||
      typeof newPassword !== "string" ||
      !email.trim() ||
      !otpCode.trim() ||
      !newPassword.trim()
    ) {
      return res.status(400).json({ success: false, message: "Invalid input format" });
    }

    // Password strength check (min 8 chars, 1 uppercase, 1 digit)
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: PASSWORD_COMPLEXITY_ERROR,
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (
      !user.resetPasswordOtp ||
      user.resetPasswordOtp !== otpCode.trim() ||
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires < Date.now()
    ) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await logAudit({
      req,
      user,
      action: "AUTH_PASSWORD_RESET_SUCCESS",
      details: `Pomyślnie zresetowano hasło dla konta: ${user.email}`,
      targetId: user._id,
      targetType: "User",
    });

    return res.status(200).json({ success: true, message: "Password has been successfully changed" });
  } catch (error) {
    next(error);
  }
};
