import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["ORDER_CREATED", "STATUS_CHANGED", "REMINDER_SENT", "SYSTEM", "OTHER"],
      default: "OTHER",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  { timestamps: true }
);

// Auto-delete read notifications after 7 days (7 * 24 * 60 * 60 seconds)
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Auto-delete any remaining notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
