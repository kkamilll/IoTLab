import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "lecturer"], default: "lecturer", required: true },
  labRooms: [{ type: String }],
  isActive: { type: Boolean, default: true },
  profileImage: { type: String, default: "" },
  tokenVersion: { type: Number, default: 0 },
  passwordChangedAt: Date,
  resetPasswordOtp: String,
  resetPasswordOtpExpires: Date,
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
