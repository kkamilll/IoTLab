import express from "express";
import { getNotes, addNote, deleteNote } from "../controllers/NoteController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/", getNotes); // publiczne

// chronimy tylko POST i DELETE
router.post("/", protect, addNote);
router.delete("/:id", protect, deleteNote);


export default router;
