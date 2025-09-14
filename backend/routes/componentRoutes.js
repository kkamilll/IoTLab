import express from "express";
import multer from "multer";
import {
  getComponents,
  createCategory,
  deleteCategory,
  addFile,
  deleteFile,
  getComponentById,
} from "../controllers/ComponentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// konfiguracja Multer – pliki idą do folderu uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.get("/", getComponents);
router.post("/create", authMiddleware, createCategory);
router.delete("/:categoryId", authMiddleware, deleteCategory);
router.post("/:categoryId/files", authMiddleware, upload.single("file"), addFile);
router.delete("/:categoryId/files/:fileId", authMiddleware, deleteFile);
router.get("/:categoryId", getComponentById);

export default router;
