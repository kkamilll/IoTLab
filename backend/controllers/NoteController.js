import Note from "../models/Note.js";
import mongoose from "mongoose";
import { ValidationError, BadRequestError, PermissionError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'

// Pobierz wszystkie notatki (ważne na górze)
export const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find()
      .populate("author", "name email role")
      .sort({ important: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};

// Dodaj notatkę
export const createNote = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// Usuń notatkę
export const hardDeleteNote = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// Aktualizacja notatki (text + important)
export const updateNote = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};
