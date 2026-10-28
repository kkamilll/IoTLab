import AuditLog from "../models/AuditLog.js";

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { action, targetType, search } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (search?.trim()) {
      filter.$or = [
        { userName: { $regex: search.trim(), $options: "i" } },
        { details: { $regex: search.trim(), $options: "i" } },
        { targetId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};
