import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getProducts,
  createProduct,
  updateProduct,
  hardDeleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", authMiddleware, getProducts);
router.post("/", authMiddleware, createProduct);
router.put("/:productId", authMiddleware, updateProduct);
router.delete("/:productId", authMiddleware, hardDeleteProduct);

export default router;