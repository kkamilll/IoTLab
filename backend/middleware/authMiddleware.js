import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Użytkownik nie znaleziony" });
      }
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Nieautoryzowany" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Brak tokena autoryzacji" });
  }
};

export default protect;
