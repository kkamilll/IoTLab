import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getOrderStatuses, getOrders, getReturnedOrders, createOrder, returnOrder, hardDeleteOrder, sendOrderEmail, updateOrderQuantity, updateOrderDates } from "../controllers/orderController.js";

const router = express.Router();

router.get("/statuses", authMiddleware, getOrderStatuses);

router.get("/returned", authMiddleware, getReturnedOrders);
router.get("/", authMiddleware, getOrders);
router.post("/create", authMiddleware, createOrder);
router.post("/returned", authMiddleware, returnOrder);
router.delete("/:orderId", authMiddleware, hardDeleteOrder);

router.post("/send-order-email", authMiddleware, sendOrderEmail);
router.post("/update-quantity", authMiddleware, updateOrderQuantity);
router.post("/update-dates", authMiddleware, updateOrderDates);

export default router;