import Product from "../models/Product.js";
import mongoose from "mongoose";
import {
  AppError,
  ValidationError,
  BadRequestError,
  DuplicateKeyError,
  PermissionError,
  ResourceNotFoundError,
  ConflictError,
  ServerError,
} from "../errors/CustomErrors.js";
import Order from "../models/Order.js";
import asyncHandler from "../middleware/asyncHandler.js";

const mapUploadedFiles = (filesArray = [], additionalData = []) => {
  if (!filesArray.length || filesArray.length !== additionalData.length)
    return [];

  return filesArray.map((file, idx) => {
    const pathNormalized = file.path ? file.path.replace(/\\/g, "/") : "";
    return {
      filename: file.filename,
      originalName: additionalData[idx]?.originalName || file.originalname,
      uniqueKey: additionalData[idx]?.uniqueKey,
      isVisible: additionalData[idx]?.isVisible || false,
      size: file.size || 0,
      path: pathNormalized,
    };
  });
};

const initProduct = (req) => {
  const { name, description } = req.body;
  const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

  const stockTotal =
    req.body.stockTotal !== undefined ? Number(req.body.stockTotal) : undefined;
  const stockForRent =
    req.body.stockForRent !== undefined
      ? Number(req.body.stockForRent)
      : undefined;
  const categories = req.body.categories
    ? JSON.parse(req.body.categories)
    : undefined;
  const extraFields = req.body.extraFields
    ? JSON.parse(req.body.extraFields)
    : undefined;

  const newImageFiles = req.files?.images;
  const newImagesData = req.body.newImagesData
    ? JSON.parse(req.body.newImagesData)
    : [];
  const images = mapUploadedFiles(newImageFiles, newImagesData);

  const oldImages = req.body.oldImages ? JSON.parse(req.body.oldImages) : [];

  const newAttachmentsFiles = req.files?.attachments;
  const newAttachmentsData = req.body.newAttachmentsData
    ? JSON.parse(req.body.newAttachmentsData)
    : [];
  const attachments = mapUploadedFiles(newAttachmentsFiles, newAttachmentsData);

  const oldAttachments = req.body.oldAttachments
    ? JSON.parse(req.body.oldAttachments)
    : [];

  const labRoom = req.body.labRoom;
  const owner = req.body.owner;

  const parseBoolean = (val) => val === true || val === "true";
  const isSerialized = parseBoolean(req.body.isSerialized);
  const isRentable = parseBoolean(req.body.isRentable);
  const isVisible = parseBoolean(req.body.isVisible);
  const isShared = parseBoolean(req.body.isShared);
  const version = Number(req.body.version);

  const setData = {};
  const unsetData = {};

  if (name?.trim()) setData.name = name;
  else unsetData.name = "";
  if (description?.trim()) setData.description = description;
  else unsetData.description = "";

  // Validate stockTotal value
  if (stockTotal !== undefined) {
    if (isNaN(stockTotal) || stockTotal < 0)
      throw new BadRequestError("stockTotal must be a non-negative number");
    setData.stockTotal = stockTotal;
  } else unsetData.stockTotal = "";

  // Validate stockForRent value
  if (stockForRent !== undefined) {
    if (isNaN(stockForRent) || stockForRent < 0)
      throw new BadRequestError("stockForRent must be a non-negative number");
    if (stockForRent > stockTotal)
      throw new BadRequestError(
        "stockForRent cannot be bigger than stockTotal",
      );
    setData.stockForRent = stockForRent;
  } else unsetData.stockForRent = "";

  if (tags) {
    let tagsArr = tags;
    if (!Array.isArray(tags)) tagsArr = [tags];
    setData.tags = tagsArr.map((tag) => tag.trim().toLowerCase());
  } else unsetData.tags = "";

  if (Array.isArray(categories)) {
    categories.forEach((category) => {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        throw new ValidationError("Invalid category ID");
      }
    });
    setData.categories = categories;
  } else unsetData.categories = "";

  if (extraFields !== undefined && typeof extraFields === "object")
    setData.extraFields = extraFields;
  else unsetData.extraFields = "";

  if (images && images.length) setData.images = images;
  else unsetData.images = "";
  if (oldImages && oldImages.length) setData.oldImages = oldImages;
  else unsetData.oldImages = "";

  if (attachments && attachments.length) setData.attachments = attachments;
  else unsetData.attachments = "";
  if (oldAttachments && oldAttachments.length)
    setData.oldAttachments = oldAttachments;
  else unsetData.oldAttachments = "";

  if (labRoom?.trim() && labRoom !== "undefined" && labRoom !== "null")
    setData.labRoom = labRoom;
  else unsetData.labRoom = "";
  if (owner?.trim() && owner !== "undefined" && owner !== "null") {
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      throw new ValidationError("Invalid user ID");
    }
    setData.owner = new mongoose.Types.ObjectId(String(owner));
  } else unsetData.owner = "";

  if (typeof isSerialized === "boolean") setData.isSerialized = isSerialized;
  else unsetData.isSerialized = "";
  if (typeof isRentable === "boolean") setData.isRentable = isRentable;
  else unsetData.isRentable = "";
  if (typeof isVisible === "boolean") setData.isVisible = isVisible;
  else unsetData.isVisible = "";
  if (typeof isShared === "boolean") setData.isShared = isShared;
  else unsetData.isShared = "";
  if (!isNaN(version)) setData.__v = version;
  else throw new ValidationError("Missing version number");

  return { $set: setData, $unset: unsetData };
};

const getOrderQuantity = async ({
  productId,
  ownerId,
  field,
  end,
  start,
  status,
}) => {
  status = Array.isArray(status) ? status : [status];

  // Find orders for product, that overlap given date range
  const baseItemFilter = {
    items: {
      $elemMatch: {
        product: new mongoose.Types.ObjectId(String(productId)),
        responsibleOwner: new mongoose.Types.ObjectId(String(ownerId)),
        status: { $in: status },
      },
    },
  };

  let filter = {
    ...baseItemFilter,

    ...(field === "requested" && {
      requestedStartDate: { $lte: end },
      requestedEndDate: { $gte: start },
    }),

    ...(field === "assigned" && {
      ownersData: {
        $elemMatch: {
          owner: new mongoose.Types.ObjectId(String(ownerId)),
          assignedStartDate: { $lte: end },
          assignedEndDate: { $gte: start },
        },
      },
    }),
  };

  const result = await Order.aggregate([
    { $match: filter },
    { $project: { items: 1 } },
    { $unwind: "$items" },
    {
      $match: {
        "items.product": new mongoose.Types.ObjectId(String(productId)),
      },
    },
    {
      $group: {
        _id: null,
        orderQuantity: {
          $sum: `$items.${field === "requested" ? "requestedQuantity" : "assignedQuantity"}`,
        },
        requestsQuantity: { $sum: 1 },
      },
    },
  ]);
  const orderQuantity = result[0]?.orderQuantity || 0;
  const requestsQuantity = result[0]?.requestsQuantity || 0;

  return { orderQuantity, requestsQuantity };
};

export const getProductsPublic = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ isVisible: true, isDeleted: false })
    .select("-__v -isDeleted")
    .sort({ name: 1 })
    .populate([
      { path: "categories", select: "name" },
      { path: "owner", select: "name" },
    ])
    .lean();
  const productsImagesFiltered =
    products?.map((product) => ({
      ...product,
      images: product.images?.filter((img) => img.isVisible) || [],
    })) || [];

  res.json({ success: true, products: productsImagesFiltered });
});

export const getProductsPrivate = asyncHandler(async (req, res, next) => {
  const role = req.user.role;
  const user = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(user)) {
    return next(new ValidationError("Invalid user ID"));
  }

  let filter = { isDeleted: false };
  if (role !== "admin") {
    filter = {
      isDeleted: false,
      $or: [{ owner: user }, { isShared: true }, { isVisible: true }],
    };
  }
  const products = await Product.find(filter)
    .select("-isDeleted")
    .sort({ name: 1 })
    .populate([
      { path: "categories", select: "name" },
      { path: "owner", select: "name" },
    ])
    .lean();

  return res.status(200).json({ success: true, products });
});

export const getProductByIdPublic = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new ValidationError("Invalid product ID"));
  }

  const product = await Product.findOne({
    _id: productId,
    isVisible: true,
    isDeleted: false,
  })
    .select("-__v -isDeleted")
    .sort({ name: 1 })
    .populate([
      { path: "categories", select: "name" },
      { path: "owner", select: "name" },
    ])
    .lean();
  if (product) {
    product.images = product.images?.filter((image) => image.isVisible) || [];
    product.attachments =
      product.attachments?.filter((attachment) => attachment.isVisible) || [];

    // Send response
    return res.status(200).json({ success: true, product });
  }

  return res.status(404).json({ success: false, message: "Product not found" });
});

export const getProductByIdPrivate = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new ValidationError("Invalid product ID"));
  }

  const role = req.user.role;
  const user = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(user)) {
    return next(new ValidationError("Invalid user ID"));
  }

  let filter = { _id: productId, isDeleted: false };
  if (role !== "admin") {
    filter = {
      _id: productId,
      isDeleted: false,
      $or: [{ owner: user }, { isShared: true }, { isVisible: true }],
    };
  }

  const product = await Product.findOne(filter).populate([
    { path: "categories", select: "name" },
    { path: "owner", select: "name" },
  ]);
  if (!product) {
    return next(new ResourceNotFoundError("Product"));
  }

  return res.status(200).json({ success: true, product });
});

export const createProduct = asyncHandler(async (req, res, next) => {
  if (!req.body) {
    return next(new BadRequestError("Request body is missing"));
  }

  try {
    const updateData = initProduct(req);
    const createData = updateData.$set;

    const newProduct = new Product(createData);
    await newProduct.save();

    return res
      .status(201)
      .json({ success: true, product: newProduct.toObject() });
  } catch (error) {
    throw error;
  }
});

export const updateProduct = asyncHandler(async (req, res, next) => {
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

  const updateData = initProduct(req);

  if (!Object.keys(updateData).length) {
    return next(new BadRequestError("No valid fields to update"));
  }

  let filterProducts = { _id: productId, isDeleted: false };
  if (role !== "admin") {
    filterProducts = { _id: productId, isDeleted: false, owner: user };
  }

  try {
    const product = await Product.findOne(filterProducts);
    if (!product)
      return next(new ResourceNotFoundError("Missing permission or Product"));

    // Handle files (images & attachments)
    const fileFields = [
      ["oldImages", "images"],
      ["oldAttachments", "attachments"],
    ];

    for (const [filterFields, productField] of fileFields) {
      const setOldFiles = updateData?.$set[filterFields];
      const unsetOldFiles = updateData?.$unset[filterFields];
      if (unsetOldFiles != null) continue;

      const productFilesFiltered = setOldFiles
        .map((setFile) => {
          const productFile = product[productField].find(
            (productFile) =>
              productFile._id.toString() === setFile.fileId.toString(),
          );

          if (!productFile) return null;
          return {
            ...(productFile?.toObject() ?? productFile),
            isVisible: setFile.isVisible,
          };
        })
        .filter(Boolean);

      if (!updateData.$set[productField])
        updateData.$set[productField] = productFilesFiltered;
      else updateData.$set[productField].push(...productFilesFiltered);

      delete updateData.$unset[productField];
    }

    // check owner
    const originalOwner = product.owner?.toString();
    const newOwner = updateData.$set.owner?.toString();

    const blockingStatuses = ["approved", "prepared", "rented"];

    if (originalOwner !== newOwner) {
      const filterOrders = {};
      filterOrders.items = {
        $elemMatch: { product: productId, status: { $in: blockingStatuses } },
      };
      const blockingOrder = await Order.findOne(filterOrders)
        .select("_id")
        .lean();

      if (blockingOrder) {
        return next(
          new ConflictError(
            "Cannot modify ownership while there are active orders",
          ),
        );
      }
    }

    // Apply updates
    if (updateData.$set) {
      Object.entries(updateData.$set).forEach(([key, value]) =>
        product.set(key, value),
      );
    }
    if (updateData.$unset) {
      Object.keys(updateData.$unset).forEach((key) =>
        product.set(key, undefined),
      );
    }

    const updatedProduct = await product.save(); // optimistic concurrency enforced

    // update orders
    if (originalOwner !== newOwner) {
      const filterOrders = {};
      filterOrders.items = {
        $elemMatch: { product: product._id, status: "pending" },
      };
      const pendingOrders = await Order.find(filterOrders);
      for (const pendingOrder of pendingOrders) {
        pendingOrder.items.forEach((item) => {
          if (
            item.responsibleOwner?.toString() === originalOwner &&
            item.product?.toString() === productId
          ) {
            item.responsibleOwner = updateData.$set.owner;
          }
        });
        pendingOrder._updatedProducts = [product];
        await pendingOrder.save();
      }
    }

    return res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    if (error.name === "VersionError") {
      return next(new ConflictError("Product was modified by someone else"));
    }
    throw error;
  }
});

export const archiveProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new ValidationError("Invalid product ID"));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ResourceNotFoundError("Product"));
  }

  if (product.isDeleted) {
    return next(new BadRequestError("Product is already archived"));
  }

  product.isDeleted = true;
  await product.save();

  return res.status(200).json({ success: true, message: "Product archived" });
});

export const hardDeleteProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new ValidationError("Invalid product ID"));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ResourceNotFoundError("Product"));
  }

  await product.deleteOne();

  return res.status(200).json({ success: true, message: "Product deleted" });
});

export const deleteExtraField = asyncHandler(async (req, res, next) => {
  const { key } = req.params;
  await Product.updateMany({}, { $unset: { [`extraFields.${key}`]: "" } });

  return res
    .status(200)
    .json({ success: true, message: `Field '${key}' deleted` });
});

export const getProductAvailability = asyncHandler(async (req, res, next) => {
  const { productId, startDate, endDate } = req.body;

  if (!productId || !startDate || !endDate) {
    return next(new BadRequestError("Missing required parameters"));
  }

  const product = await Product.findById(productId);
  if (!product || product.isDeleted) {
    return next(new ResourceNotFoundError("Product"));
  }

  const ownerId = product.owner?._id
    ? product.owner._id?.toString()
    : product.owner?.toString();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const { orderQuantity } = await getOrderQuantity({
    productId,
    ownerId,
    field: "assigned",
    end,
    start,
    status: ["approved", "prepared", "rented"],
  });

  const available = Math.max(0, Number(product.stockForRent) - orderQuantity);

  return res.json({ success: true, available });
});

export const getProductStockStatus = asyncHandler(async (req, res, next) => {
  const { productId, startDate, endDate, orderId } = req.body;
  if (!productId || !startDate || !endDate || !orderId) {
    return next(new BadRequestError("Missing data"));
  }

  const product = await Product.findById(productId).lean();
  if (!product || product.isDeleted) {
    return next(new ResourceNotFoundError("Product"));
  }

  const ownerId = product.owner?._id
    ? product.owner._id?.toString()
    : product.owner?.toString();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const order = await Order.findById(orderId).lean();
  if (!order) return next(new ResourceNotFoundError("Order"));
  const currProduct = order.items?.find(
    (item) => item.product?.toString() === productId,
  );

  const { orderQuantity: inDemand, requestsQuantity } = await getOrderQuantity({
    productId,
    ownerId,
    field: "requested",
    start,
    end,
    status: "pending",
  });
  const { orderQuantity: confirmedQuantityReserved } = await getOrderQuantity({
    productId,
    ownerId,
    field: "assigned",
    start,
    end,
    status: ["approved", "prepared"],
  });
  const { orderQuantity: rentedQuantity } = await getOrderQuantity({
    productId,
    ownerId,
    field: "assigned",
    start,
    end,
    status: ["rented"],
  });

  const currQuantityAssigned = currProduct?.assignedQuantity || 0;

  const availableTotal =
    Number(product.stockForRent) - rentedQuantity - confirmedQuantityReserved;

  let availableToAssign = availableTotal;
  availableToAssign = availableTotal + currQuantityAssigned;

  return res.json({
    success: true,
    inDemand,
    requestsQuantity,
    availableToAssign,
    availableTotal,
    rentedQuantity,
  });
});
