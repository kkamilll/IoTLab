import express from "express";
import { getNotes, createNote, deleteNote } from "../controllers/NoteController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/", getNotes); // publiczne

// chronimy tylko POST i DELETE
router.post("/", protect, createNote);
router.delete("/:noteId", protect, deleteNote);


export default router;