import Component from "../models/Component.js";
import mongoose from "mongoose";
import fs from "fs";

import {
  BadRequestError,
  ResourceNotFoundError,
  PermissionError,
  ServerError,
} from "../errors/CustomErrors.js";

export const getCollections = async (req, res, next) => {
  try {
    const collections = await Component.find().populate("author", "name email").lean();
    res.status(200).json({ success: true, data: collections });
  } catch (error) {
    next(error);
  }
};

export const getCollectionById = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(collectionId))
      return next(new BadRequestError("Invalid collection ID"));

    const collection = await Component.findById(collectionId).populate("author", "name email").lean();
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    res.status(200).json({ success: true, data: collection });
  } catch (error) {
    next(error);
  }
};


// Dodaj kategorię
export const createCollection = async (req, res, next) => {
  try {
    const { name, logo } = req.body;
    const userId = req.user._id;
    if (!name) return next(new BadRequestError("Collection name required"));

    const collection = new Component({ name, logo, files: [], author: userId });
    await collection.save();
    await collection.populate("author", "name email");

    res.status(201).json({ success: true, data: collection });
  } catch (error) {
    next(error);
  }
};

// Usuń kategorię
export const deleteCollection = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(collectionId))
      return next(new BadRequestError("Invalid collection ID"));

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    await collection.deleteOne();
    res.status(200).json({ success: true, message: "Collection deleted" });
  } catch (error) {
    next(error);
  }
};

export const addLink = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    let { text, href } = req.body;

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    if (!/^https?:\/\//i.test(href)) href = "http://" + href.trim();

    const newLink = { text, href };
    collection.links.push(newLink);

    await collection.save();

    res.status(201).json({ success: true, data: newLink });
  } catch (error) {
    next(error);
  }
}

export const updateLink = async (req, res, next) => {
  try {
    const { collectionId, fileId } = req.params;
    let { text, href } = req.body;
    if (!text || !href) return next(new BadRequestError("Link text and redirection is required"));

    if (!/^https?:\/\//i.test(href)) href = "http://" + href.trim();

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    const link = collection.links.id(fileId);
    if (!link) return next(new ResourceNotFoundError("Link"));

    link.text = text;
    link.href = href; 

    await collection.save();

    res.status(200).json({ success: true, message: "Link updated" });
  } catch (error) {
    next(error);
  }
}

export const deleteLink = async (req, res, next) => {
  try {
    const { collectionId, fileId } = req.params;

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    collection.links = collection.links.filter(link => link._id.toString() !== fileId);
    await collection.save();

    res.status(200).json({ success: true, message: "Link deleted" });
  } catch (error) {
    next(error);
  }
}

// Dodaj plik do kategorii
export const addFile = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    if (!req.file) return next(new BadRequestError("File required"));

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    const pathNormalized = req.file.path ? req.file.path.replace(/\\/g, "/") : "";
    const newFile = {
      name: req.file.originalname,
      path: pathNormalized,
      mimeType: req.file.mimetype,
    };

    collection.files.push(newFile);
    await collection.save();

    res.status(201).json({ success: true, data: newFile });
  } catch (error) {
    next(error);
  }
};

// Usuń plik
export const deleteFile = async (req, res, next) => {
  try {
    const { collectionId, fileId } = req.params;
    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    const fileToDelete = collection.files.find(f => f._id.toString() === fileId);

    collection.files = collection.files.filter(f => f._id.toString() !== fileId);
    await collection.save();

    if (fileToDelete && fs.existsSync(fileToDelete.path)) await fs.promises.unlink(fileToDelete.path);

    res.status(200).json({ success: true, message: "File deleted" });
  } catch (error) {
    next(error);
  }
};

export const editCollection = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    const { name, logo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(collectionId))
      return next(new BadRequestError("Invalid collection ID"));

    if (!name) return next(new BadRequestError("Collection name required"));

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    collection.name = name;
    if(logo) collection.logo = logo;

    await collection.save();

    res.status(200).json({ success: true, data: collection });
  } catch (error) {
    next(error);
  }
};