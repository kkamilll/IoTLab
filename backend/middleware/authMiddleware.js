import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { UnauthorizedError } from "../errors/CustomErrors.js"

const protect = async (req, res, next) => {
  try{
    const authHeader = req.headers.authorization;
    if (!authHeader || ! authHeader.startsWith("Bearer")) return next(new UnauthorizedError("Missing authorization token"));

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id name email role");
    if (!user) return next(new UnauthorizedError("User not found"))
    req.user = user;
    next();
  } catch (error) {
    return next(new UnauthorizedError( error.message ));
  }
};

export default protect;
