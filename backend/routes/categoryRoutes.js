// routes/categories.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/CategoryController.js"

const router = express.Router();

router.get("/", getCategories);
router.post("/add", authMiddleware, createCategory);
router.patch("/:categoryId", authMiddleware, updateCategory);
router.delete("/:categoryId", authMiddleware, deleteCategory);

export default router;
