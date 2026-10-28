import AuditLog from "../models/AuditLog.js";

/**
 * Record an audit log entry
 * @param {Object} params
 * @param {Object} [params.req] Express request object to extract IP and user
 * @param {Object} [params.user] User object if not in req
 * @param {string} params.action Action code (e.g. ORDER_APPROVED, STOCK_CHANGED, LOGIN_SUCCESS)
 * @param {string} params.details Human-readable description
 * @param {string|mongoose.Types.ObjectId} [params.targetId] ID of target entity
 * @param {string} [params.targetType] Target entity type ("Order" | "Product" | "User" | "Auth" | "System")
 */
export const logAudit = async ({
  req = null,
  user = null,
  action,
  details,
  targetId = null,
  targetType = "System",
}) => {
  try {
    const activeUser = user || req?.user;
    const ip =
      req?.headers?.["x-forwarded-for"] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      "";

    await AuditLog.create({
      user: activeUser?._id || activeUser?.id || null,
      userName: activeUser?.name || activeUser?.email || "System / Gość",
      userRole: activeUser?.role || "guest",
      action,
      details,
      targetId: targetId ? String(targetId) : null,
      targetType,
      ip: Array.isArray(ip) ? ip[0] : String(ip),
    });
  } catch (err) {
    console.error("[AUDIT LOG ERROR] Failed to record audit log:", err.message);
  }
};
