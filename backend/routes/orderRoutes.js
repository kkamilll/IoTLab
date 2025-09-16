import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getOrderStatuses, getOrders, createOrder, updateOrder, customerUpdateOrder, hardDeleteOrder, getCustomerOrder, getOrderStats } from "../controllers/orderController.js";

const router = express.Router();

router.get("/stats", authMiddleware, getOrderStats);
router.get("/statuses", authMiddleware, getOrderStatuses);

// router.get("/returned", authMiddleware, getReturnedOrders);
router.get("/customerOrder/:orderUUID", getCustomerOrder);
router.get("/", authMiddleware, getOrders);
router.post("/create", createOrder);
router.post("/customerUpdate/:orderId", customerUpdateOrder);
router.put("/updateOrder/:orderId", authMiddleware, updateOrder);
// router.put("/quickUpdateOrder/:orderId", authMiddleware, quickUpdateOrder);
// router.post("/returned", authMiddleware, returnOrder);
router.delete("/:orderId", authMiddleware, hardDeleteOrder);

// router.post("/send-order-email", sendOrderEmail);
// router.post("/update-quantity", authMiddleware, updateOrderQuantity);
// router.post("/update-dates", authMiddleware, updateOrderDates);

export default router;