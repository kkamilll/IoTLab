import rateLimit from "express-rate-limit";

// Rate limiter for login: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Zbyt wiele nieudanych prób logowania z tego adresu IP. Odczekaj 15 minut.",
  },
});

// Rate limiter for forgot password requests: 5 requests per 15 minutes per IP
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Zbyt wiele prób żądania resetu hasła. Odczekaj 15 minut przed kolejną próbą.",
  },
});

// Rate limiter for password reset confirmation: 10 attempts per 15 minutes per IP
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Zbyt wiele prób zatwierdzenia kodu resetu hasła. Odczekaj 15 minut.",
  },
});
