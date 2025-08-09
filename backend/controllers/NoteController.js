import Note from "../models/Note.js";

// Pobierz wszystkie notatki (z autorem)
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find()
      .populate("author", "name email role") // można dodać role, jeśli potrzebne
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};

// Dodaj notatkę (author z tokena)
export const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Pole tekst jest wymagane" });
    }

    const newNote = new Note({
      text,
      author: req.user._id,
    });

    await newNote.save();
    await newNote.populate("author", "name email");

    res.status(201).json({ success: true, data: newNote });
  } catch (error) {
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Notatka nie znaleziona" });
    }

    if (note.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Brak uprawnień do usunięcia notatki" });
    }

    await Note.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Notatka usunięta" });
  } catch (error) {
    console.error("Błąd przy usuwaniu notatki:", error);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};

