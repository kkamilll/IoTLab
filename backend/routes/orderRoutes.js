import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createOrder, getOrders, deleteOrder } from "../controllers/orderController.js";

const router = express.Router();

router.post("/add", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.delete("/:orderId", authMiddleware, deleteOrder);

export default router;