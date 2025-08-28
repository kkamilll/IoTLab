import Product from "../models/Product.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'
import { validateRequiredFields } from '../utils/validateRequiredFields.js'

import Order from "../models/Order.js";

const getOrderQuantity = async ({ productId, field, end, start, status }) => {
  // Find orders for product, that overlap given date range
  const overlappingOrders = await Order.find({
    items: {
      $elemMatch: {
        product: productId,
        [`${field}.startDate`]: { $lte: end },
        [`${field}.endDate`]: { $gte: start },
        status,
        isReturned: false
      }
    }
  });

  let orderQuantity = 0;
  let requestsQuantity = 0;

  overlappingOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.product.toString() === productId) {
          orderQuantity += Number(item[field].quantity);
          requestsQuantity += 1;
        }
      });
    });

  return { orderQuantity, requestsQuantity };
}

export const getProductsPublic = async (req, res, next) => {
  try {
    const products = await Product.find({ isRentable: true, isDeleted: false }).select('-__v -isDeleted').sort({ name: 1 }).populate("categories", "name").lean();;
    res.json({ success: true, products });
  } catch (err) {
    return next(new ServerError({ message: error.message }));
  }
}

export const getProductsPrivate = async (req, res, next) => {
  try {
    // Find all products
    const products = await Product.find({ isDeleted: false }).select('-__v -isDeleted').sort({ name: 1 }).populate("categories", "name").lean();

    // Send response
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const getProductByIdPublic = async (req, res, next) => {
  try {
    const { productId } = req.params;
    // Find products for users
    const products = await Product.findOne({ _id: productId, isRentable: true, isDeleted: false }).select('-__v -isDeleted').sort({ name: 1 }).populate("categories", "name").lean();

    // Send response
    return res.status(200).json({ success: true, products });
  } catch (error) {
    // Handle unexpected server error
    return next(new ServerError({ message: error.message }));
  }
};

export const getProductByIdPrivate = async (req, res, next) => {
  try {
    // Extract route params
    const { productId } = req.params;
    // Validate productId has ObjectId structure
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    const product = await Product.findOne({ _id: productId, isDeleted: false }).populate("categories", "name");
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
    // Ensure request body exists
    if (!req.body) {
      return next(new BadRequestError("Request body is missing"));
    }

    // Extract incoming data
    const { name, description, tag } = req.body;
    const stockTotal = Number(req.body.stockTotal);
    const stockForRent = Number(req.body.stockTotal);
    const categories = req.body.categories ? JSON.parse(req.body.categories) : [];
    const extraFields = req.body.extraFields ? JSON.parse(req.body.extraFields) : {};
    const images = req.files?.map(file => ({ image: file.filename })) || [];
    const owner = req.user._id;
    console.log(images);
    
    const updateData = { name, description, stockTotal, stockForRent, categories, tag, extraFields, images, owner };
    
    // Validate required fields
    validateRequiredFields(Product, updateData);

    // Validate stockTotal value
    if (isNaN(stockTotal) || stockTotal < 0) return next(new BadRequestError('Stock must be a non-negative number'));
      updateData.stockTotal = stockTotal;
    
    // Validate stockForRent value
    if (isNaN(stockForRent) || stockForRent < 0) return next(new BadRequestError('Stock must be a non-negative number'));
      updateData.stockTotal = stockTotal;

    // create new product
    const newProduct = new Product({ ...updateData });
    await newProduct.save();
    
    // Send response
    return res.status(201).json({ success: true, product: newProduct.toObject() });
  } catch (error) {
    // Handle duplicate key error
    if (error instanceof MongoServerError && error.code === 11000) {
      const [field, value] = Object.entries(error.keyValue)[0];
      return next(new DuplicateKeyError({ field, value }));
    }

    // Handle validation error
    if (error.name === 'ValidationError') {
      return next(error);
    }

    // Handle unexpected server error
    return next(new ServerError({ message: error.message }));
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    // Ensure request body exists
    if (!req.body) {
      return next(new BadRequestError("Request body is missing"));
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    const { name, description, tag } = req.body;
    const stockTotal = Number(req.body.stockTotal);
    const categories = req.body.categories ? JSON.parse(req.body.categories) : [];
    const extraFields = req.body.extraFields ? JSON.parse(req.body.extraFields) : {};
    const images = req.files?.map(file => file.filename) || [];

    const updateData = {};
    if (name?.trim()) updateData.name = name;
    if (description?.trim()) updateData.description = description;
    if (stockTotal !== undefined) {
      if (isNaN(stockTotal) || stockTotal < 0) return next(new BadRequestError('Stock must be a non-negative number'));
      updateData.stockTotal = stockTotal;
    }
    if (tag) updateData.tag = tag;
    if (Array.isArray(categories)) updateData.categories = categories;
    if (extraFields !== undefined && typeof extraFields === 'object') updateData.extraFields = extraFields;
    if(images) updateData.images = images;

    if (Object.keys(updateData).length === 0) {
      return next(new BadRequestError('No valid fields to update'));
    }

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

export const deleteExtraField = async (req, res, next) => {
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

export const checkAvailable = async (req, res, next) => {
  try {
    const { productId, startDate, endDate } = req.body;

    if (!productId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Brak danych" });
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: "Produkt nie znaleziony" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const { orderQuantity } = await getOrderQuantity({ productId, field: "confirmed", end, start, status: "approved" });
    // let reservedQuantity = await getOrderQuantity({ productId, field: "requested", end, start, status: "pending" });

    // Available stock is stockForRent minus reservedQuantity
    const available = Math.max(0, Number(product.stockForRent) - orderQuantity);

    return res.json({ success: true, available });
  } catch (err) {
    console.error("Błąd w /products/available:", err);
    return res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};

export const checkInDemand = async (req, res, next) => {
  try {
    const { productId, startDate, endDate } = req.body;
    if (!productId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Brak danych" });
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: "Produkt nie znaleziony" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const { orderQuantity, requestsQuantity } = await getOrderQuantity({ productId, field: "requested", start, end, status: "pending" });

    return res.json({ success: true, inDemand: orderQuantity, requestsQuantity });
  } catch (err) {
    console.error("Błąd w /products/requested:", err);
    return res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};