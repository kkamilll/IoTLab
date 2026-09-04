import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProductsPublic, getProductsPrivate, getProductByIdPublic, getProductByIdPrivate, createProduct, updateProduct, hardDeleteProduct, deleteExtraField, getProductAvailability, getProductStockStatus } from "../controllers/productController.js";
import { filesUploadProduct } from "../middleware/fileUpload.js";

const router = express.Router();

router.get("/public", getProductsPublic);
router.get("/private", authMiddleware, getProductsPrivate);
router.get("/publicId/:productId", getProductByIdPublic);
router.get("/privateId/:productId", authMiddleware, getProductByIdPrivate);

router.post("/available", getProductAvailability);
router.post("/stockStatus", authMiddleware, getProductStockStatus);
router.post("/create", authMiddleware, filesUploadProduct.fields([{ name: "images", maxCount: 5 }, { name: "attachments", maxCount: 3 }]), createProduct);

router.put("/:productId", authMiddleware, filesUploadProduct.fields([{ name: "images", maxCount: 5 }, { name: "attachments", maxCount: 3 }]), updateProduct);

router.delete("/:productId", authMiddleware, hardDeleteProduct);
router.delete("/extraField/:key", authMiddleware, deleteExtraField);

export default router;