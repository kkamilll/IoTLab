import Component from "../models/Component.js";
import mongoose from "mongoose";
import {
  BadRequestError,
  ResourceNotFoundError,
  PermissionError,
  ServerError,
} from "../errors/CustomErrors.js";

// Pobierz kategorie
export const getComponents = async (req, res, next) => {
  try {
    const categories = await Component.find().populate("author", "name email");
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};
// Pobierz kategorię po ID
export const getComponentById = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId))
      return next(new BadRequestError("Invalid ID"));

    const category = await Component.findById(categoryId).populate("author", "name email");
    if (!category) return next(new ResourceNotFoundError("Category"));

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};


// Dodaj kategorię
export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user._id;
    if (!name) return next(new BadRequestError("Category name required"));

    const category = new Component({ name, files: [], author: userId });
    await category.save();
    await category.populate("author", "name email");

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};

// Usuń kategorię
export const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId))
      return next(new BadRequestError("Invalid ID"));

    const category = await Component.findById(categoryId);
    if (!category) return next(new ResourceNotFoundError("Category"));

    await category.deleteOne();
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};

// Dodaj plik do kategorii
export const addFile = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    if (!req.file) return next(new BadRequestError("File required"));

    const category = await Component.findById(categoryId);
    if (!category) return next(new ResourceNotFoundError("Category"));

    const newFile = {
      name: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
    };

    category.files.push(newFile);
    await category.save();

    res.status(201).json({
      success: true,
      data: category.files[category.files.length - 1],
    });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};

// Usuń plik
export const deleteFile = async (req, res, next) => {
  try {
    const { categoryId, fileId } = req.params;
    const category = await Component.findById(categoryId);
    if (!category) return next(new ResourceNotFoundError("Category"));

    category.files = category.files.filter(f => f._id.toString() !== fileId);
    await category.save();

    res.status(200).json({ success: true, message: "File deleted" });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};
