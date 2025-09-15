import express from "express";
import multer from "multer";
import {
  getCollections,
  createCollection,
  deleteCollection,
  addFile,
  deleteFile,
  getCollectionById,
  editCollection,
} from "../controllers/ComponentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { filesUploadCollection } from "../middleware/fileUpload.js";

const router = express.Router();

router.get("/", getCollections);
router.post("/create", authMiddleware, createCollection);
router.delete("/:collectionId", authMiddleware, deleteCollection);
router.post("/:collectionId/files", authMiddleware, filesUploadCollection.single("file"), addFile);
router.delete("/:collectionId/files/:fileId", authMiddleware, deleteFile);
router.get("/:collectionId", getCollectionById);
router.patch("/:collectionId", authMiddleware, editCollection);

export default router;