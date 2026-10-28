import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import { getAuditLogs } from "../controllers/auditController.js";

const router = express.Router();

// Only admin can view audit logs
router.get("/", authMiddleware, adminOnly, getAuditLogs);

export default router;
