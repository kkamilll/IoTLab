import express from "express";
import { getNotes, createNote, hardDeleteNote } from "../controllers/NoteController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getNotes); // publiczne
router.post("/", authMiddleware, createNote);
router.delete("/:noteId", authMiddleware, hardDeleteNote);

export default router;