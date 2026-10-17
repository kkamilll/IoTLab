import express from "express";
import { getNotifications, markAsRead, markAllAsRead, deleteAllNotifications } from "../controllers/notificationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply protect middleware to all routes below
router.use(protect);

router.route("/")
  .get(getNotifications)
  .delete(deleteAllNotifications);
  
router.route("/read-all").patch(markAllAsRead);
router.route("/:id/read").patch(markAsRead);

export default router;
