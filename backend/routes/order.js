import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addOrder, getOrders, deleteOrder, getReturnedOrders, returnOrder } from "../controllers/orderController.js";

const router = express.Router();

router.get("/returned", authMiddleware, getReturnedOrders);
router.post("/add", authMiddleware, addOrder);
router.get("/", authMiddleware, getOrders);
router.delete("/:id", authMiddleware, deleteOrder);
router.post("/returned", authMiddleware, returnOrder);

export default router;
