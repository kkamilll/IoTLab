import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import { getTemplateById, getTemplates, createTemplate, updateTemplate, deleteTemplate } from "../controllers/TemplateController.js";

const router = express.Router();

router.get("/:templateId", authMiddleware, getTemplateById);
router.get("/", authMiddleware, getTemplates);

router.post("/add", authMiddleware, createTemplate);

router.put("/update/:templateId", authMiddleware, updateTemplate);

router.delete("/delete", authMiddleware, deleteTemplate);

export default router;