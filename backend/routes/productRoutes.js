import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProducts, getProductById, createProduct, updateProduct, hardDeleteProduct, deleteExtraField } from "../controllers/productController.js";
import { imageUpload } from "../middleware/imageUpload.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:productId", getProductById);
router.post("/", authMiddleware, imageUpload.single("image"), createProduct);
router.put("/:productId", authMiddleware, imageUpload.single("image"), updateProduct);
router.delete("/:productId", authMiddleware, hardDeleteProduct);
router.delete("/extraField/:key", authMiddleware, deleteExtraField);

export default router;