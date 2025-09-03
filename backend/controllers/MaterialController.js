import Material from "../models/Material.js";

import { AppError, ValidationError, BadRequestError, PermissionError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'

// Pobierz wszystkie materiały z autorem
export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find()
      .populate("author", "name email role")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};

// Dodaj materiał (plik z multer + author z tokena)
export const addMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Brak pliku" });
    }

    const newMaterial = new Material({
      filename: req.file.originalname,
      path: req.file.path,
      author: req.user._id,
    });

    await newMaterial.save();
    await newMaterial.populate("author", "name email");

    res.status(201).json({ success: true, data: newMaterial });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};

// Usuń materiał
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({ success: false, message: "Materiał nie znaleziony" });
    }

    // tylko autor lub admin może usuwać
    if (material.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Brak uprawnień do usunięcia materiału" });
    }

    await Material.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Materiał usunięty" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};
