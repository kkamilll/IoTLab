import Notification from "../models/Notification.js";
import asyncHandler from "../middleware/asyncHandler.js";

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // We filter by user if it's not admin, or admin can see all? 
  // For history, let's say it shows notifications tied to the currently logged in user.
  // Wait, if it's admin, they might want to see EVERYTHING. Let's return only their notifications for now, 
  // or everything if admin and requested. By default let's tie to req.user._id.
  const query = req.user.role === "admin" && req.query.all === "true" 
    ? {} 
    : { user: req.user._id };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("relatedOrder", "uuid status requestedStartDate")
    .populate("relatedProduct", "name");

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

  res.json({
    success: true,
    notifications,
    page,
    totalPages: Math.ceil(total / limit),
    total,
    unreadCount,
  });
});

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  // Ensure user owns it or is admin
  if (notification.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Not authorized");
  }

  notification.isRead = true;
  await notification.save();

  res.json({ success: true, notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" && req.query.all === "true" 
    ? {} 
    : { user: req.user._id };

  await Notification.updateMany({ ...query, isRead: false }, { isRead: true });

  res.json({ success: true, message: "All notifications marked as read" });
});

// @desc    Delete all notifications for logged in user
// @route   DELETE /api/notifications
// @access  Private
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" && req.query.all === "true" 
    ? {} 
    : { user: req.user._id };

  await Notification.deleteMany(query);

  res.json({ success: true, message: "All notifications deleted" });
});

// Helper function to create a notification (used internally by other controllers)
export const createNotification = async ({ user, type, title, message, relatedOrder = null, relatedProduct = null }) => {
  try {
    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      relatedOrder,
      relatedProduct,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw, we don't want to break the main flow if a notification fails
  }
};
