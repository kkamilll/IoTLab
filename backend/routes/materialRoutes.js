import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { filesUploadMaterial } from "../middleware/fileUpload.js";

import { addMaterial, getMaterials, deleteMaterial, reorderMaterials, updateMaterialLink } from "../controllers/MaterialController.js";

const router = express.Router();

router.get("/", getMaterials);

router.post("/", authMiddleware, filesUploadMaterial.single("file"), addMaterial);

router.patch("/reorder", authMiddleware, reorderMaterials);
router.patch("/:id", authMiddleware, updateMaterialLink);

router.delete("/:id", authMiddleware, deleteMaterial);

export default router;