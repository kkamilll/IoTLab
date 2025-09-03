import Material from "../models/Material.js";
import fs from "fs";

import { AppError, ValidationError, BadRequestError, PermissionError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'

// Pobierz wszystkie materiały z autorem
export const getMaterials = async (req, res) => {
  try {
  const materials = await Material.find()
  .populate("author", "name email role")
  .sort({ order: 1 }); // rosnąco wg order

    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    console.error("❌ getMaterials error:", error);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};

export const addMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Brak pliku" });
    }

 // Przy dodawaniu nowego materiału
const newMaterial = new Material({
  filename: req.file.originalname,
  path: req.file.path,
  link: req.body.link || null,
  author: req.user ? req.user._id : null,
  order: await Material.countDocuments() + 1, // ustawia nowy element na końcu
});


    await newMaterial.save();

    if (newMaterial.author) {
      await newMaterial.populate("author", "name email");
    }

    res.status(201).json({ success: true, data: newMaterial });
  } catch (error) {
    console.error("addMaterial error:", error);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};

// ❌ Usuń materiał

export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({ success: false, message: "Materiał nie znaleziony" });
    }

    // Usuwanie pliku fizycznego z serwera, jeśli istnieje
    if (material.path) {
      fs.unlink(material.path, (err) => {
        if (err) console.error("Błąd usuwania pliku:", err);
      });
    }

    await Material.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Materiał usunięty" });
  } catch (error) {
    console.error("❌ deleteMaterial error:", error);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};




export const updateMaterialLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { link } = req.body;
    const material = await Material.findById(id);
    if (!material) return res.status(404).json({ success: false, message: "Materiał nie znaleziony" });

    material.link = link;
    await material.save();
    res.status(200).json({ success: true, data: material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};
export const reorderMaterials = async (req, res) => {
  try {
    const { materials } = req.body; // tablica { id, order }

    if (!Array.isArray(materials)) {
      return res.status(400).json({ success: false, message: "Niepoprawne dane" });
    }

    const bulkOps = materials.map((m) => ({
      updateOne: {
        filter: { _id: m.id },
        update: { order: m.order },
      },
    }));

    await Material.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Kolejność zaktualizowana" });
  } catch (err) {
    console.error("reorderMaterials error:", err);
    res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};