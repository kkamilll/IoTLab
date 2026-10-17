import Note from "../models/Note.js";
import mongoose from "mongoose";
import { ValidationError, BadRequestError, PermissionError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'
import asyncHandler from "../middleware/asyncHandler.js";

// Pobierz wszystkie notatki (ważne na górze)
export const getNotes = asyncHandler(async (req, res, next) => {
  const notes = await Note.find()
    .populate("author", "name email role")
    .sort({ important: -1, createdAt: -1 });
  res.status(200).json({ success: true, data: notes });
});

// Dodaj notatkę
export const createNote = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { text, important } = req.body;

  if (!text || text.trim() === "") return next(new ValidationError("Text is required."));

  const newNote = new Note({
    text,
    author: userId,
    important: !!important,
  });

  await newNote.save();
  await newNote.populate("author", "name email");
  res.status(201).json({ success: true, data: newNote });
});

// Usuń notatkę
export const hardDeleteNote = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { role } = req.user;
  const { noteId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(noteId)) return next(new BadRequestError("Invalid note ID"));

  const note = await Note.findById(noteId);
  if (!note) return next(new ResourceNotFoundError("Note"));

  if (note.author.toString() !== userId.toString() && role !== 'admin') 
    return next(new PermissionError("Missing permission for deleting this note."));

  await note.deleteOne();
  res.status(200).json({ success: true, message: "Note Deleted" });
});

// Aktualizacja notatki (text + important)
export const updateNote = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { role } = req.user;
  const { noteId } = req.params;
  const { text, important } = req.body;

  if (!mongoose.Types.ObjectId.isValid(noteId)) return next(new BadRequestError("Invalid note ID"));

  const note = await Note.findById(noteId);
  if (!note) return next(new ResourceNotFoundError("Note"));

  if (note.author.toString() !== userId.toString() && role !== 'admin') 
    return next(new PermissionError("Missing permission to edit this note."));

  note.text = text ?? note.text;
  if (important !== undefined) note.important = !!important;

  await note.save();
  await note.populate("author", "name email");
  res.status(200).json({ success: true, data: note });
});

