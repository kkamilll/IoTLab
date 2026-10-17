// routes/categories.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import { getCategoriesPublic, getCategoriesPrivate, createCategory, updateCategory, deleteCategory } from "../controllers/CategoryController.js"

const router = express.Router();

router.get("/public", getCategoriesPublic);
router.get("/private", authMiddleware, getCategoriesPrivate);

router.post("/create", authMiddleware, createCategory);

router.patch("/:categoryId", authMiddleware, updateCategory);

router.delete("/:categoryId", authMiddleware, deleteCategory);

export default router;
