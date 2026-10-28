// routes/categories.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

import { getCategoriesPublic, getCategoriesPrivate, createCategory, updateCategory, deleteCategory } from "../controllers/CategoryController.js"

const router = express.Router();

router.get("/public", getCategoriesPublic);
router.get("/private", authMiddleware, getCategoriesPrivate);

router.post("/create", authMiddleware, adminOnly, createCategory);

router.patch("/:categoryId", authMiddleware, adminOnly, updateCategory);

router.delete("/:categoryId", authMiddleware, adminOnly, deleteCategory);

export default router;
