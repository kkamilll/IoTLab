import Material from "../models/Material.js";
import fs from "fs";
import { AppError, ValidationError, BadRequestError, PermissionError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js';
import asyncHandler from "../middleware/asyncHandler.js";

// Get all materials with author
export const getMaterials = asyncHandler(async (req, res, next) => {
  const materials = await Material.find()
    .populate("author", "name email role")
    .sort({ order: 1 });

  res.status(200).json({ success: true, data: materials });
});

export const addMaterial = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new BadRequestError("No file provided"));

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
});

export const deleteMaterial = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const material = await Material.findById(id);
  if (!material) return next(new ResourceNotFoundError("Material"));

  if (material.path) fs.unlink(material.path, (err) => { if (err) console.error("File deletion error:", err); });
  await Material.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Material deleted" });
});

export const updateMaterialLink = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { link } = req.body;
  const material = await Material.findById(id);
  if (!material) return next(new ResourceNotFoundError("Material"));

  material.link = link;
  await material.save();

  res.status(200).json({ success: true, data: material });
});

export const reorderMaterials = asyncHandler(async (req, res, next) => {
  const { materials } = req.body;
  if (!Array.isArray(materials)) return next(new BadRequestError("Invalid data"));

  const bulkOps = materials.map((m) => ({
    updateOne: { filter: { _id: m.id }, update: { order: m.order } }
  }));

  await Material.bulkWrite(bulkOps);
  res.status(200).json({ success: true, message: "Order updated" });
});
