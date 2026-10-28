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
    const collections = await Component.find().populate("author", "name email profileImage").lean();
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

    const collection = await Component.findById(collectionId).populate("author", "name email profileImage").lean();
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    res.status(200).json({ success: true, data: collection });
  } catch (error) {
    next(error);
  }
};


// Dodaj kategorię
export const createCollection = async (req, res, next) => {
  try {
    const { name, description, logo, isDirectLink, directUrl } = req.body;
    const userId = req.user._id;
    if (!name) return next(new BadRequestError("Collection name required"));

    const collection = new Component({
      name,
      description: description ? String(description).trim() : "",
      logo,
      texts: [],
      files: [],
      links: [],
      author: userId,
      isDirectLink: Boolean(isDirectLink),
      directUrl: directUrl ? String(directUrl).trim() : "",
    });
    await collection.save();
    await collection.populate("author", "name email profileImage");

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
    const { name, description, logo, isDirectLink, directUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(collectionId))
      return next(new BadRequestError("Invalid collection ID"));

    if (!name) return next(new BadRequestError("Collection name required"));

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    collection.name = name;
    if (description !== undefined) collection.description = String(description).trim();
    if (logo !== undefined) collection.logo = logo;
    if (isDirectLink !== undefined) collection.isDirectLink = Boolean(isDirectLink);
    if (directUrl !== undefined) collection.directUrl = directUrl ? String(directUrl).trim() : "";

    await collection.save();

    res.status(200).json({ success: true, data: collection });
  } catch (error) {
    next(error);
  }
};

export const addText = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    const { title, content } = req.body;

    if (!title || !title.trim()) {
      return next(new BadRequestError("Text title is required"));
    }

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    const newText = {
      title: title.trim(),
      content: content ? String(content).trim() : "",
    };

    if (!collection.texts) collection.texts = [];
    collection.texts.push(newText);
    await collection.save();

    const createdText = collection.texts[collection.texts.length - 1];
    res.status(201).json({ success: true, data: createdText });
  } catch (error) {
    next(error);
  }
};

export const updateText = async (req, res, next) => {
  try {
    const { collectionId, textId } = req.params;
    const { title, content } = req.body;

    if (!title || !title.trim()) {
      return next(new BadRequestError("Text title is required"));
    }

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    const textItem = collection.texts?.id(textId);
    if (!textItem) return next(new ResourceNotFoundError("Text item"));

    textItem.title = title.trim();
    if (content !== undefined) textItem.content = String(content).trim();

    await collection.save();

    res.status(200).json({ success: true, message: "Text updated", data: textItem });
  } catch (error) {
    next(error);
  }
};

export const deleteText = async (req, res, next) => {
  try {
    const { collectionId, textId } = req.params;

    const collection = await Component.findById(collectionId);
    if (!collection) return next(new ResourceNotFoundError("Collection"));

    if (collection.texts) {
      collection.texts = collection.texts.filter((t) => t._id.toString() !== textId);
      await collection.save();
    }

    res.status(200).json({ success: true, message: "Text deleted" });
  } catch (error) {
    next(error);
  }
};