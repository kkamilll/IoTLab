import Material from "../models/Material.js";
import fs from "fs";
import { AppError, ValidationError, BadRequestError, PermissionError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js';

// Get all materials with author
export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find()
      .populate("author", "name email role")
      .sort({ order: 1 });

    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    next(error);
  }
};

export const addMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided" });

    // Przesuń wszystkie istniejące materiały o 1 w dół
    await Material.updateMany({}, { $inc: { order: 1 } });

    // Dodaj nowy materiał z order = 1
    const newMaterial = new Material({
      filename: req.file.originalname,
      path: req.file.path,
      link: req.body.link || null,
      author: req.user ? req.user._id : null,
      order: 1,
    });

    await newMaterial.save();
    if (newMaterial.author) await newMaterial.populate("author", "name email");

    res.status(201).json({ success: true, data: newMaterial });
  } catch (error) {
    next(error);
  }
};


export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    if (material.path) fs.unlink(material.path, (err) => { if (err) console.error("File deletion error:", err); });
    await Material.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Material deleted" });
  } catch (error) {
    next(error);
  }
};

export const updateMaterialLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { link } = req.body;
    const material = await Material.findById(id);
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    material.link = link;
    await material.save();

    res.status(200).json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
};

export const reorderMaterials = async (req, res) => {
  try {
    const { materials } = req.body;
    if (!Array.isArray(materials)) return res.status(400).json({ success: false, message: "Invalid data" });

    const bulkOps = materials.map((m) => ({
      updateOne: { filter: { _id: m.id }, update: { order: m.order } }
    }));

    await Material.bulkWrite(bulkOps);
    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    next(error);
  }
};
