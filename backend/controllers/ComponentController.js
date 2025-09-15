import Component from "../models/Component.js";
import mongoose from "mongoose";
import {
  BadRequestError,
  ResourceNotFoundError,
  PermissionError,
  ServerError,
} from "../errors/CustomErrors.js";

export const getCollections = async (req, res, next) => {
  try {
    const collections = await Component.find().populate("author", "name email");
    res.status(200).json({ success: true, data: collections });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};

export const getCollectionById = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(collectionId))
      return next(new BadRequestError("Invalid ID"));

    const collection = await Component.findById(collectionId).populate("author", "name email");
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    res.status(200).json({ success: true, data: collection });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};


// Dodaj kategorię
export const createCollection = async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = req.user._id;
    if (!name) return next(new BadRequestError("Collection name required"));

    const collection = new Component({ name, files: [], author: userId });
    await collection.save();
    await collection.populate("author", "name email");

    res.status(201).json({ success: true, data: collection });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};

// Usuń kategorię
export const deleteCollection = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(collectionId))
      return next(new BadRequestError("Invalid ID"));

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    await collection.deleteOne();
    res.status(200).json({ success: true, message: "Collection deleted" });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};

// Dodaj plik do kategorii
export const addFile = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    if (!req.file) return next(new BadRequestError("File required"));

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    const newFile = {
      name: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
    };

    collection.files.push(newFile);
    await collection.save();

    res.status(201).json({
      success: true,
      data: collection.files[collection.files.length - 1],
    });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};

// Usuń plik
export const deleteFile = async (req, res, next) => {
  try {
    const { collectionId, fileId } = req.params;
    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    collection.files = collection.files.filter(f => f._id.toString() !== fileId);
    await collection.save();

    res.status(200).json({ success: true, message: "File deleted" });
  } catch (err) {
    return next(new ServerError({ message: err.message }));
  }
};