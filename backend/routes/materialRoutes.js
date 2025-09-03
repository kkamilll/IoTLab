import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { filesUploadMaterial } from "../middleware/fileUpload.js";

import { addMaterial, getMaterials, deleteMaterial } from "../controllers/MaterialController.js";

const router = express.Router();

router.get("/", authMiddleware, getMaterials);
router.post("/", authMiddleware, filesUploadMaterial.single("file"), addMaterial);
router.delete("/:id", authMiddleware, deleteMaterial);

export default router;