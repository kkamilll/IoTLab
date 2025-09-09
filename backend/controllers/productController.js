import Product from "../models/Product.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { AppError, ValidationError, BadRequestError, DuplicateKeyError, PermissionError, ResourceNotFoundError, ConflictError, ServerError } from '../errors/CustomErrors.js'
import { validateRequiredFields } from '../utils/validateRequiredFields.js'

import Order from "../models/Order.js";

const mapUploadedFiles = (filesArray = [], additionalData = []) => {
  const fileNames = filesArray.map(file => file.filename);
  const fileSizes = filesArray.map(file => file.size || 0);

  if (fileNames.length !== additionalData.length || fileNames.length !== fileSizes.length) return [];
  return fileNames.map((filename, idx) => ({
    filename,
    originalName: additionalData[idx].originalName,
    uniqueKey: additionalData[idx]?.uniqueKey,
    isVisible: additionalData[idx]?.isVisible || false,
    size: fileSizes[idx]
  }));
}

const initProduct = (req) => {
  try{
  const { name, description, tag } = req.body;
  const stockTotal = req.body.stockTotal !== undefined ? Number(req.body.stockTotal) : undefined;
  const stockForRent = req.body.stockForRent !== undefined ? Number(req.body.stockForRent) : undefined;
  const categories = req.body.categories ? JSON.parse(req.body.categories) : undefined;
  const extraFields = req.body.extraFields ? JSON.parse(req.body.extraFields) : undefined;

  const newImageFiles = req.files?.images;
  const newImagesData = req.body.newImagesData ? JSON.parse(req.body.newImagesData) : [];
  const newImages = mapUploadedFiles(newImageFiles, newImagesData);

  const oldImages = req.body.oldImages ? JSON.parse(req.body.oldImages) : [];
  const images = [...oldImages, ...newImages];

  const newAttachmentsFiles = req.files?.attachments;
  const newAttachmentsData = req.body.newAttachmentsData ? JSON.parse(req.body.newAttachmentsData) : [];
  const newAttachments = mapUploadedFiles(newAttachmentsFiles, newAttachmentsData);

  const oldAttachments = req.body.oldAttachments ? JSON.parse(req.body.oldAttachments) : [];
  const attachments = [...oldAttachments, ...newAttachments];
  
  const labRoom = req.body.labRoom;
  const owner = req.body.owner;
  const isSerialized = JSON.parse(req.body.isSerialized);
  const isRentable = JSON.parse(req.body.isRentable);
  const isVisible = JSON.parse(req.body.isVisible);
  const isShared = JSON.parse(req.body.isShared);
  const version = Number(req.body.version);

  const setData = {};
  const unsetData = {};

  if (name?.trim()) setData.name = name; else unsetData.name = "";
  if (description?.trim()) setData.description = description; else unsetData.description = "";

  // Validate stockTotal value
  if (stockTotal !== undefined) {
    if (isNaN(stockTotal) || stockTotal < 0) throw new BadRequestError('stockTotal must be a non-negative number');
    setData.stockTotal = stockTotal;
  } else unsetData.stockTotal = "";

  // Validate stockForRent value
  if (stockForRent !== undefined) {
    if (isNaN(stockForRent) || stockForRent < 0) throw new BadRequestError('stockForRent must be a non-negative number');
    if (stockForRent > stockTotal) throw new BadRequestError('stockForRent cannot be bigger than stockTotal');
    setData.stockForRent = stockForRent;
  } else unsetData.stockForRent = "";

  if (tag) setData.tag = tag; else unsetData.tag = "";
  if (Array.isArray(categories)) {
    categories.forEach((category) => {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        throw new ValidationError("Invalid category ID");
      }
    })
    setData.categories = categories;
  } else unsetData.categories = "";

  if (extraFields !== undefined && typeof extraFields === 'object') setData.extraFields = extraFields; else unsetData.extraFields = "";
  if (images && images.length) setData.images = images; else unsetData.images = "";
  if (attachments && attachments.length) setData.attachments = attachments; else unsetData.attachments = "";
  if (labRoom?.trim() && labRoom !== "undefined" && labRoom !== "null") setData.labRoom = labRoom; else unsetData.labRoom = "";
  if (owner?.trim() && owner !== "undefined" && owner !== "null") {
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      throw new ValidationError("Invalid user ID");
    }
    setData.owner = owner;
  } else unsetData.owner = "";

  console.log(isSerialized, typeof isSerialized === 'boolean');
  if (typeof isSerialized === 'boolean') setData.isSerialized = isSerialized; else unsetData.isSerialized = "";
  if (typeof isRentable === 'boolean') setData.isRentable = isRentable; else unsetData.isRentable = "";
  if (typeof isVisible === 'boolean') setData.isVisible = isVisible; else unsetData.isVisible = "";
  if (typeof isShared === 'boolean') setData.isShared = isShared; else unsetData.isShared = "";
  if (!isNaN(version)) setData.__v = version; else throw new ValidationError("Missing version number");
  
  return { $set: setData, $unset: unsetData };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new ServerError(error);
  }
}

const getOrderQuantity = async ({ productId, field, end, start, status }) => {
  // Find orders for product, that overlap given date range
  const overlappingOrders = await Order.find({
    items: {
      $elemMatch: {
        product: productId,
        [`${field}.startDate`]: { $lte: end },
        [`${field}.endDate`]: { $gte: start },
        status,
      }
    }
  });

  let orderQuantity = 0;
  let requestsQuantity = 0;

  overlappingOrders.forEach(order => {
    order.items?.forEach(item => {
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
    const products = await Product.find({ isVisible: true, isDeleted: false }).select('-__v -isDeleted').sort({ name: 1 }).populate([{ path: "categories", select: "name" }, { path: "owner", select: "name" }]).lean();
    const productsImagesFiltered = products?.map(product => ({ ...product, images: product.images?.filter(img => img.isVisible) || [] })) || [];

    res.json({ success: true, products: productsImagesFiltered });
  } catch (err) {
    return next(new ServerError({ message: error.message }));
  }
}

export const getProductsPrivate = async (req, res, next) => {
  try {
    const role = req.user.role;
    const user = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return next(new ValidationError("Invalid user ID"));
    }

    let filter = { isDeleted: false }
    // Find all products
    if (role !== "admin") {
      filter = { isDeleted: false, $or: [{ owner: user }, { isShared: true }, { isVisible: true }] }
    }
    const products = await Product.find(filter).select('-isDeleted').sort({ name: 1 }).populate([{ path: "categories", select: "name" }, { path: "owner", select: "name" }]).lean();

    // Send response
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const getProductByIdPublic = async (req, res, next) => {
  try {
    // Extract route params
    const { productId } = req.params;
    // Validate productId has ObjectId structure
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    // Find products for users
    const product = await Product.findOne({ _id: productId, isVisible: true, isDeleted: false }).select('-__v -isDeleted').sort({ name: 1 }).populate([{ path: "categories", select: "name" }, { path: "owner", select: "name" }]).lean();
    product.images = product.images?.filter(image => (image.isVisible)) || [];

    // Send response
    return res.status(200).json({ success: true, product });
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

    const role = req.user.role;
    const user = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return next(new ValidationError("Invalid user ID"));
    }

    let filter = { _id: productId, isDeleted: false }
    // Find all products
    if (role !== "admin") {
      filter = { _id: productId, isDeleted: false, $or: [{ owner: user }, { isShared: true }, { isVisible: true }] }
    }

    const product = await Product.findOne(filter).populate([{ path: "categories", select: "name" }, { path: "owner", select: "name" }]);
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
    const updateData = initProduct(req, next);
    const createData = updateData.$set;
    // if (!updateData.owner) updateData.owner = req.user._id;

    // Validate required fields
    validateRequiredFields(Product, createData);

    // create new product
    const newProduct = new Product(createData);
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

    const role = req.user.role;
    const user = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return next(new ValidationError("Invalid user ID"));
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    const updateData = initProduct(req, next);
    // console.log(updateData);

    if (!Object.keys(updateData).length) {
      return next(new BadRequestError('No valid fields to update'));
    }

    let filter = { _id: productId, isDeleted: false };
    if (role !== "admin") {
      filter = { _id: productId, isDeleted: false, owner: user }
    }

    // const updatedProduct = await Product.findOneAndUpdate(filter, updateData, { new: true, runValidators: true }).select('-__v -isDeleted').populate("categories", "name").lean();
    // if (!updatedProduct) {
    //   return next(new ResourceNotFoundError("Missing permission or Product"));
    // }

    // return res.status(200).json({ success: true, product: updatedProduct });

    const product = await Product.findOne(filter);
    if (!product) return next(new ResourceNotFoundError("Missing permission or Product"));

    // Apply updates
    if (updateData.$set) {
      Object.entries(updateData.$set).forEach(([key, value]) => product.set(key, value));
    }
    if (updateData.$unset) {
      Object.keys(updateData.$unset).forEach(key => product.set(key, undefined));
    }

    validateRequiredFields(Product, product);
    const updatedProduct = await product.save(); // optimistic concurrency enforced
    return res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    if (error.name === "VersionError") {
      return next(new ConflictError("Product was modified by someone else"));
    }

    return next(new ServerError({ success: false, message: error.message }));
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

export const getProductAvailability = async (req, res, next) => {
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

    const { orderQuantity } = await getOrderQuantity({ productId, field: "assigned", end, start, status: "approved" });
    // let reservedQuantity = await getOrderQuantity({ productId, field: "requested", end, start, status: "pending" });

    // Available stock is stockForRent minus reservedQuantity
    const available = Math.max(0, Number(product.stockForRent) - orderQuantity);

    return res.json({ success: true, available });
  } catch (err) {
    console.error("Błąd w /products/available:", err);
    return res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};

export const getProductStockStatus = async (req, res, next) => {
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
    const { orderQuantity: confirmedQuantity } = await getOrderQuantity({ productId, field: "assigned", start, end, status: "approved" });

    const available = Math.max(0, Number(product.stockForRent) - (Number(product.stockRentedOut) || 0) - confirmedQuantity);

    return res.json({ success: true, inDemand: orderQuantity, requestsQuantity, available });
  } catch (err) {
    console.error("Błąd w /products/requested:", err);
    return res.status(500).json({ success: false, message: "Błąd serwera" });
  }
};