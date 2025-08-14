import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";

// Generate a 6-digit OTP code as a string
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2d" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Forgot password - send OTP to email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpCode = generateOtp();
    user.resetPasswordOtp = otpCode;
    user.resetPasswordOtpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    await user.save();

    await sendVerificationCode(otpCode, user.email, res);
    return res.status(200).json({ success: true, message: "Verification Code sent to email" });
  } catch (error) {
    console.error("Error sending OTP code:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Reset password using OTP
export const resetPassword = async (req, res) => {
  try {
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
    console.error("Password reset error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};