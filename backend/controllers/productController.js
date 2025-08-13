import Product from "../models/Product.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'
import { validateRequiredFields } from '../utils/validateRequiredFields.js'

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isDeleted: false }).select('-__v -isDeleted').sort({ name: 1 }).lean();
    
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, stock, description, extraFields } = req.body;
    validateRequiredFields(Product, req.body); 

    const newProduct = new Product({
      name,
      stock,
      description,
      extraFields
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

    const { name, stock, description, extraFields } = req.body;
    const updateData = {};
    if (name?.trim()) updateData.name = name;
    if (stock !== undefined) {
      if (typeof stock !== 'number' || stock < 0) {
        return next(new BadRequestError('Stock must be a non-negative number'));
      }

      updateData.stock = stock;
    }
    if (description?.trim()) updateData.description = description;
    if (extraFields !== undefined && typeof extraFields === 'object') updateData.extraFields = extraFields;

    if (Object.keys(updateData).length === 0) {
      return next(new BadRequestError('No valid fields to update'));
    }

    const updatedProduct = await Product.findOneAndUpdate({ _id: productId, isDeleted: false }, updateData, { new: true }).select('_id name stock description extraFields').lean();
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

    return res.status(200).json({ success: true, message: "Product deleted" });
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