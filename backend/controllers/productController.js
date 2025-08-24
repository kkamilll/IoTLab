import Product from "../models/Product.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'
import { validateRequiredFields } from '../utils/validateRequiredFields.js'

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isDeleted: false }).select('-__v -isDeleted').sort({ name: 1 }).populate("categories", "name").lean();
    
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const getProductById = async (req, res, next) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new ValidationError("Invalid product ID"));
  }

  try {
    const product = await Product.findById(productId).populate("categories", "name");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, description, stock, tag } = req.body;
    const categories  = req.body.categories ? JSON.parse(req.body.categories) : [];
    const extraFields = req.body.extraFields ? JSON.parse(req.body.extraFields) : {};
    const image = req.file ? req.file.filename : null
    const updateData = { name, description, stock, categories , tag, extraFields, image };
    validateRequiredFields(Product, updateData); 

    const newProduct = new Product({
      name: updateData.name,
      description: updateData.description || "",
      stock: updateData.stock,
      categories: updateData.categories ,
      tag: updateData.tag || "",
      extraFields: updateData.extraFields,
      image: updateData.image
    });

    await newProduct.save();
    return res.status(201).json({ success: true, product: newProduct.toObject() });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }

    if (error.name === 'ValidationError') {
      return next(error);
    }

    return next(new ServerError({ message: error.message }));
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    const { name, description, tag } = req.body;
    const stock = Number(req.body.stock);
    const categories = req.body.categories ? JSON.parse(req.body.categories) : [];
    const extraFields = req.body.extraFields ? JSON.parse(req.body.extraFields) : {};
    const image = req.file ? req.file.filename : null;
    
    const updateData = {};
    if (name?.trim()) updateData.name = name;
    if (description?.trim()) updateData.description = description;
    if (stock !== undefined) {
      if (isNaN(stock) || stock < 0) return next(new BadRequestError('Stock must be a non-negative number'));
      updateData.stock = stock;
    }
    if (tag) updateData.tag = tag;
    if (Array.isArray(categories)) updateData.categories = categories;
    if (extraFields !== undefined && typeof extraFields === 'object') updateData.extraFields = extraFields;

    if (Object.keys(updateData).length === 0) {
      return next(new BadRequestError('No valid fields to update'));
    }
    updateData.image = image;

    const updatedProduct = await Product.findOneAndUpdate({ _id: productId, isDeleted: false }, updateData, { new: true }).select('-__v -isDeleted').populate("categories", "name").lean();
    if (!updatedProduct) {
      return next(new ResourceNotFoundError("Product"));
    }
    
    return res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const archiveProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ResourceNotFoundError('Product'));
    }
 
    if (product.isDeleted) {
      return next(new BadRequestError("Product is already archived"));
    }

    product.isDeleted = true;
    await product.save();

    return res.status(200).json({ success: true, message: "Product archived" });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const hardDeleteProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ResourceNotFoundError('Product'));
    }

    await product.deleteOne();

    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const deleteExtraField = async (req, res) => {
  try {
    const { key } = req.params;
    // Ustawiamy key na undefined dla wszystkich produktów
    await Product.updateMany(
      {},
      { $unset: { [`extraFields.${key}`]: "" } }
    );

    return res.status(200).json({ success: true, message: `Field '${key}' deleted` });
  } catch (error) {
    console.error("Error deleting extra field:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};