import Category from "../models/Category.js";

import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import {
  AppError,
  ValidationError,
  BadRequestError,
  DuplicateKeyError,
  ResourceNotFoundError,
  ServerError,
} from "../errors/CustomErrors.js";
// import { validateRequiredFields } from '../utils/validateRequiredFields.js'

async function createParentMap() {
  const categories = await Category.find().select("_id parent");
  const parentMap = {};
  for (const cat of categories) {
    parentMap[cat._id.toString()] = cat.parent?.toString() || null;
  }
  return parentMap;
}

function isLoop(categoryId, newParentId, parentMap) {
  let currentParrent = newParentId?.toString();
  while (currentParrent) {
    if (currentParrent === categoryId.toString()) return true;
    currentParrent = parentMap[currentParrent];
  }
  return false;
}

export const getCategoriesPublic = async (req, res, next) => {
  try {
    const categories = await Category.find({ isVisible: true })
      .populate("parent", "name")
      .lean();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

export const getCategoriesPrivate = async (req, res, next) => {
  try {
    const categories = await Category.find().populate("parent", "name").lean();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    if (!req.body) {
      return next(new BadRequestError("Request body is missing"));
    }
    const { name, nameEn, description, descriptionEn, parent, isVisible } = req.body;
    const updateData = { name, nameEn, description, descriptionEn, parent, isVisible };

    // validateRequiredFields(Category, updateData);

    if (parent) {
      if (!mongoose.Types.ObjectId.isValid(parent)) {
        return next(new ValidationError("Invalid category reference"));
      }

      const parentCategory = await Category.findById(parent);
      if (!parentCategory)
        return next(
          new BadRequestError("Category reference has to exist in databse"),
        );
    }

    if (isVisible !== undefined && typeof isVisible !== "boolean") {
      return next(
        new ValidationError(
          "Create category: Category visibility must be true or false",
        ),
      );
    }

    const category = await Category.create({ ...updateData });
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    if (!req.body) {
      return next(new BadRequestError("Request body is missing"));
    }
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    const { name, nameEn, description, descriptionEn, isVisible } = req.body;
    const parent = req.body.parent ? req.body.parent : null;

    if (parent) {
      if (!mongoose.Types.ObjectId.isValid(parent)) {
        return next(new ValidationError("Invalid category reference"));
      }

      const parentMap = await createParentMap();
      const loop = await isLoop(categoryId, parent, parentMap);
      if (loop)
        return next(
          new BadRequestError(
            "Cannot update category: references cannot create loops",
          ),
        );
    }

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { name, nameEn, description, descriptionEn, parent, isVisible },
      { new: true, runValidators: true },
    );
    res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return next(new ValidationError("Invalid category ID"));
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return next(new ResourceNotFoundError("Category"));
    }
    await category.deleteOne();

    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    next(error);
  }
};
