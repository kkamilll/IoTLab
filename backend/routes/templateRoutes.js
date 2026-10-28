import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

import { getTemplateNames, getTemplateById, getTemplates, createTemplate, updateTemplate, deleteTemplate } from "../controllers/TemplateController.js";

const router = express.Router();

router.get("/names", authMiddleware, adminOnly, getTemplateNames);
router.get("/:templateId", authMiddleware, adminOnly, getTemplateById);
router.get("/", authMiddleware, adminOnly, getTemplates);

router.post("/create", authMiddleware, adminOnly, createTemplate);

router.put("/update/:templateId", authMiddleware, adminOnly, updateTemplate);

router.delete("/delete/:templateId", authMiddleware, adminOnly, deleteTemplate);

export default router;