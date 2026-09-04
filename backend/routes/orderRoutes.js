import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getOrderStatuses, getOrders, createOrder, updateOrder, customerUpdateOrder, hardDeleteOrder, getCustomerOrder, getOrderStats, downloadPDF } from "../controllers/orderController.js";

const router = express.Router();

router.post("/download-pdf", downloadPDF);

router.get("/stats", authMiddleware, getOrderStats);
router.get("/statuses", authMiddleware, getOrderStatuses);
router.get("/customerOrder/:orderUUID", getCustomerOrder);
router.get("/", authMiddleware, getOrders);

router.post("/create", createOrder);
router.post("/customerUpdate/:orderId", customerUpdateOrder);

router.put("/updateOrder/:orderId", authMiddleware, updateOrder);

router.delete("/:orderId", authMiddleware, hardDeleteOrder);

export default router;