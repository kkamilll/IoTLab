import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import { filesUploadMaterial } from "../middleware/fileUpload.js";

import { addMaterial, getMaterials, deleteMaterial, reorderMaterials, updateMaterialLink } from "../controllers/MaterialController.js";

const router = express.Router();

router.get("/", getMaterials);

router.post("/", authMiddleware, adminOnly, filesUploadMaterial.single("file"), addMaterial);

router.patch("/reorder", authMiddleware, adminOnly, reorderMaterials);
router.patch("/:id", authMiddleware, adminOnly, updateMaterialLink);

router.delete("/:id", authMiddleware, adminOnly, deleteMaterial);

export default router;