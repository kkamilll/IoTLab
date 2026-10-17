import express from "express";
import { getNotes, createNote, hardDeleteNote, updateNote } from "../controllers/NoteController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getNotes);

router.post("/create", authMiddleware, createNote);

router.put("/:noteId", authMiddleware, updateNote);

router.delete("/:noteId", authMiddleware, hardDeleteNote);

export default router;
