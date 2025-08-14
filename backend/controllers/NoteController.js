import Note from "../models/Note.js";

import mongoose from "mongoose";
import { ValidationError, BadRequestError, UnauthorizedActionError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'

// Pobierz wszystkie notatki (z autorem)
export const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find().populate("author", "name email role").sort({ createdAt: -1 }); // można dodać role, jeśli potrzebne

    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

// Dodaj notatkę (author z tokena)
export const createNote = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new BadRequestError("Invalid user ID"));
    }

    const { text } = req.body;
    if (!text || text.trim() === "") {
      return next(new ValidationError("Text is required."));
    }

    const newNote = new Note({
      text,
      author: userId,
    });

    await newNote.save();
    await newNote.populate("author", "name email");

    res.status(201).json({ success: true, data: newNote });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const hardDeleteNote = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new BadRequestError("Invalid user ID"));
    }

    const { role } = req.user.role;

    const { noteId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return next(new BadRequestError("Invalid note ID"));
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return next(new ResourceNotFoundError("Note"));
    }

    if (note.author.toString() !== userId.toString() && role !== 'admin') {
      return next(new UnauthorizedActionError("Missing permission for deleting this note."));
    }

    await note.deleteOne();
    res.status(200).json({ success: true, message: "Note Deleted" });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};