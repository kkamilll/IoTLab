import express from "express";
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  deleteAllNotifications,
} from "../controllers/notificationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply protect middleware to all routes below
router.use(protect);

router.route("/")
  .get(getNotifications)
  .delete(deleteAllNotifications);

router.route("/clear-read").delete(clearReadNotifications);
router.route("/read-all").patch(markAllAsRead);

router.route("/:id/read").patch(markAsRead);
router.route("/:id/unread").patch(markAsUnread);
router.route("/:id").delete(deleteNotification);

export default router;
