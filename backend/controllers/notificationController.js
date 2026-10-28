import Notification from "../models/Notification.js";
import asyncHandler from "../middleware/asyncHandler.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Helper: purge read notifications older than 7 days
const purgeExpiredReadNotifications = async (userFilter = {}) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
    await Notification.deleteMany({
      ...userFilter,
      isRead: true,
      $or: [
        { readAt: { $lte: sevenDaysAgo } },
        { readAt: null, updatedAt: { $lte: sevenDaysAgo } },
      ],
    });
  } catch (error) {
    console.error("Failed to purge expired read notifications:", error);
  }
};

// @desc    Get all notifications for logged in user (with auto-cleanup of read older than 7 days)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const baseUserQuery =
    req.user.role === "admin" && req.query.all === "true"
      ? {}
      : { user: req.user._id };

  // Auto-clean read notifications older than 7 days on every fetch
  await purgeExpiredReadNotifications(baseUserQuery);

  // Build query filters
  const query = { ...baseUserQuery };

  // Status filter: unread / read
  if (req.query.status === "unread") {
    query.isRead = false;
  } else if (req.query.status === "read") {
    query.isRead = true;
  }

  // Type filter
  if (req.query.type && req.query.type !== "all") {
    query.type = req.query.type;
  }

  // Search filter (in title, message)
  if (req.query.search) {
    const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escaped, "i");
    query.$or = [{ title: searchRegex }, { message: searchRegex }];
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("relatedOrder", "uuid status requestedStartDate requestedEndDate")
    .populate("relatedProduct", "name");

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ ...baseUserQuery, isRead: false });
  const readCount = await Notification.countDocuments({ ...baseUserQuery, isRead: true });
  const ordersCount = await Notification.countDocuments({
    ...baseUserQuery,
    type: { $in: ["ORDER_CREATED", "STATUS_CHANGED", "REMINDER_SENT"] },
  });
  const totalUserNotifications = await Notification.countDocuments(baseUserQuery);

  res.json({
    success: true,
    notifications,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    total,
    stats: {
      total: totalUserNotifications,
      unreadCount,
      readCount,
      ordersCount,
      retentionDays: 7,
    },
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
    throw new Error("Powiadomienie nie zostało znalezione");
  }

  if (notification.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Brak uprawnień do edycji tego powiadomienia");
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({ success: true, notification });
});

// @desc    Mark a notification as unread
// @route   PATCH /api/notifications/:id/unread
// @access  Private
export const markAsUnread = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error("Powiadomienie nie zostało znalezione");
  }

  if (notification.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Brak uprawnień do edycji tego powiadomienia");
  }

  notification.isRead = false;
  notification.readAt = null;
  await notification.save();

  res.json({ success: true, notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  const query =
    req.user.role === "admin" && req.query.all === "true"
      ? {}
      : { user: req.user._id };

  await Notification.updateMany(
    { ...query, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.json({ success: true, message: "Wszystkie powiadomienia oznaczono jako przeczytane" });
});

// @desc    Delete a single notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error("Powiadomienie nie zostało znalezione");
  }

  if (notification.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Brak uprawnień do usunięcia tego powiadomienia");
  }

  await notification.deleteOne();

  res.json({ success: true, message: "Powiadomienie usunięte" });
});

// @desc    Clear all read notifications for user
// @route   DELETE /api/notifications/clear-read
// @access  Private
export const clearReadNotifications = asyncHandler(async (req, res) => {
  const query =
    req.user.role === "admin" && req.query.all === "true"
      ? { isRead: true }
      : { user: req.user._id, isRead: true };

  const result = await Notification.deleteMany(query);

  res.json({
    success: true,
    message: `Usunięto ${result.deletedCount} przeczytanych powiadomień`,
    deletedCount: result.deletedCount,
  });
});

// @desc    Delete all notifications for logged in user
// @route   DELETE /api/notifications
// @access  Private
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const query =
    req.user.role === "admin" && req.query.all === "true"
      ? {}
      : { user: req.user._id };

  const result = await Notification.deleteMany(query);

  res.json({
    success: true,
    message: `Usunięto całą historię powiadomień (${result.deletedCount})`,
    deletedCount: result.deletedCount,
  });
});

// Helper function to create a notification (used internally by other controllers)
export const createNotification = async ({
  user,
  type = "OTHER",
  title,
  message,
  relatedOrder = null,
  relatedProduct = null,
}) => {
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
