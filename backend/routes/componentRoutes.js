import express from "express";
import {
  getCollections,
  createCollection,
  deleteCollection,
  addLink,
  addFile,
  updateLink,
  deleteLink,
  deleteFile,
  getCollectionById,
  editCollection,
  addText,
  updateText,
  deleteText,
} from "../controllers/ComponentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import { filesUploadCollection } from "../middleware/fileUpload.js";

const router = express.Router();

router.get("/:collectionId", getCollectionById);
router.get("/", getCollections);

router.post("/create", authMiddleware, adminOnly, createCollection);
router.post("/:collectionId/links", authMiddleware, adminOnly, addLink);
router.post("/:collectionId/files", authMiddleware, adminOnly, filesUploadCollection.single("file"), addFile);
router.post("/:collectionId/texts", authMiddleware, adminOnly, addText);

router.put("/:collectionId/links/:fileId", authMiddleware, adminOnly, updateLink);
router.put("/:collectionId/texts/:textId", authMiddleware, adminOnly, updateText);

router.delete("/:collectionId/links/:fileId", authMiddleware, adminOnly, deleteLink);
router.delete("/:collectionId/files/:fileId", authMiddleware, adminOnly, deleteFile);
router.delete("/:collectionId/texts/:textId", authMiddleware, adminOnly, deleteText);
router.delete("/:collectionId", authMiddleware, adminOnly, deleteCollection);

router.patch("/:collectionId", authMiddleware, adminOnly, editCollection);

export default router;