import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import { getTemplateNames, getTemplateById, getTemplates, createTemplate, updateTemplate, deleteTemplate } from "../controllers/TemplateController.js";

const router = express.Router();

router.get("/names", authMiddleware, getTemplateNames);
router.get("/:templateId", authMiddleware, getTemplateById);
router.get("/", authMiddleware, getTemplates);

router.post("/create", authMiddleware, createTemplate);

router.put("/update/:templateId", authMiddleware, updateTemplate);

router.delete("/delete/:templateId", authMiddleware, deleteTemplate);

export default router;