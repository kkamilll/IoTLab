import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProductsPublic, getProductsPrivate, getProductByIdPublic, getProductByIdPrivate, createProduct, updateProduct, hardDeleteProduct, deleteExtraField, checkAvailable, checkInDemand } from "../controllers/productController.js";
import { imageUploadProduct } from "../middleware/imageUpload.js";

const router = express.Router();

router.post("/available", checkAvailable);
router.post("/inDemand", authMiddleware, checkInDemand);

router.get("/public", getProductsPublic);
router.get("/private", authMiddleware, getProductsPrivate);
router.get("/publicId/:productId", authMiddleware, getProductByIdPublic);
router.get("/privateId/:productId", authMiddleware, getProductByIdPrivate);
router.post("/create", authMiddleware, imageUploadProduct.array("images", 10), createProduct);
router.put("/:productId", authMiddleware, imageUploadProduct.array("images", 10), updateProduct);
router.delete("/:productId", authMiddleware, hardDeleteProduct);
router.delete("/extraField/:key", authMiddleware, deleteExtraField);



export default router;