import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { UnauthorizedError } from "../errors/CustomErrors.js"

const protect = async (req, res, next) => {
  try{
    const authHeader = req.headers.authorization;
    if (!authHeader || ! authHeader.startsWith("Bearer")) return next(new UnauthorizedError("Missing authorization token"));

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id name email role tokenVersion");
    if (!user) return next(new UnauthorizedError("User not found"))
    
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      return next(new UnauthorizedError("Token no longer valid due to password change"));
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return next(new UnauthorizedError("Token is no longer valid"));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Your session has expired"));
    }
    
    return next(new UnauthorizedError(error.message));
  }
};

export default protect;
