import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userName: { type: String, default: "System / Anonim" },
    userRole: { type: String, default: "guest" },
    action: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
      default: null,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Order", "Product", "User", "Auth", "System"],
      default: "System",
      index: true,
    },
    ip: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
