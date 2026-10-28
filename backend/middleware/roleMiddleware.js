import { PermissionError } from "../errors/CustomErrors.js";

/**
 * Middleware restricting route access strictly to users with the 'admin' role.
 * Requires authMiddleware to be run prior to populate req.user.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(
      new PermissionError(
        req.headers["accept-language"]?.includes("pl")
          ? "Dostęp wymaga uprawnień administratora"
          : "Access restricted to administrators only"
      )
    );
  }
  next();
};

export default adminOnly;
