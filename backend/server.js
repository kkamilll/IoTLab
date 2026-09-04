import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import express from "express";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";

// import authMiddleware from './middleware/authMiddleware.js'

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import componentRoutes from "./routes/componentRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

import fileRoutes from "./routes/fileRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { startCronJobs } from "./utils/cronJobs.js";

dotenv.config();

const app = express();

// HTTP request Logger
const accessLogStream = fs.createWriteStream(
  path.join(process.cwd(), "access.log"),
  { flags: "a" },
);
morgan.token("remote-user", (req) => (req.user ? req.user._id : "-")); // user id
morgan.token("date", () => new Date().toLocaleString("en-GB")); // local time zone
app.use(morgan("combined", { stream: accessLogStream }));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3500",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3500",
  "http://150.254.30.162",
  "http://iotlab.cs.put.poznan.pl",
];

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// handle wrong JSON requests
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }
  next();
});

app.use("/uploads", express.static("uploads"));
app.use("/files", fileRoutes);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/notes", noteRoutes);
app.use("/materials", materialRoutes);
app.use("/components", componentRoutes);
app.use("/templates", templateRoutes);
app.use("/notifications", notificationRoutes);

app.use(errorHandler);

// Global 404 handler (for any route that doesn't match)
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 3500;

// Connect to MongoDB FIRST, then start the HTTP server.
// This prevents "buffering timed out" errors caused by requests arriving
// before the Mongoose connection is established.
connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      startCronJobs();
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB, server not started:", err.message);
    process.exit(1);
  });
