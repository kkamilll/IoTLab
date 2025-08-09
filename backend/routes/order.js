import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addOrder, getOrders, deleteOrder } from "../controllers/orderController.js";

const router = express.Router();

router.post("/add", authMiddleware, addOrder);
router.get("/", authMiddleware, getOrders);
router.delete("/:id", authMiddleware, deleteOrder);

export default router;
