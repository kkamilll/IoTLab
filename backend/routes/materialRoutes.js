import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { filesUploadMaterial } from "../middleware/fileUpload.js";

import { addMaterial, getMaterials, deleteMaterial, reorderMaterials, updateMaterialLink } from "../controllers/MaterialController.js";

const router = express.Router();

router.get("/", getMaterials);
router.post("/", authMiddleware, filesUploadMaterial.single("file"), addMaterial);
router.delete("/:id", authMiddleware, deleteMaterial);
router.patch("/reorder", authMiddleware, reorderMaterials);
// PATCH aktualizacja linku
router.patch("/:id", authMiddleware, updateMaterialLink);

export default router;