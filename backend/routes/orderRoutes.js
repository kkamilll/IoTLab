import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createOrder, getOrders, hardDeleteOrder, getReturnedOrders, returnOrder } from "../controllers/orderController.js";

const router = express.Router();

router.get("/returned", authMiddleware, getReturnedOrders);
router.post("/add", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.delete("/:orderId", authMiddleware, hardDeleteOrder);
router.post("/returned", authMiddleware, returnOrder);

export default router;