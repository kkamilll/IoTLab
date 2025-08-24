import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getOrders, getReturnedOrders, createOrder, returnOrder, hardDeleteOrder } from "../controllers/orderController.js";

const router = express.Router();

router.get("/", authMiddleware, getOrders);
router.get("/returned", authMiddleware, getReturnedOrders);
router.post("/add", authMiddleware, createOrder);
router.post("/returned", authMiddleware, returnOrder);
router.delete("/:orderId", authMiddleware, hardDeleteOrder);

export default router;