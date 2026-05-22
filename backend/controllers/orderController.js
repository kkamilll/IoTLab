import Product from "../models/Product.js";
import Order from "../models/Order.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import {
  AppError,
  ValidationError,
  BadRequestError,
  DuplicateKeyError,
  ResourceNotFoundError,
  ConflictError,
  ServerError,
} from "../errors/CustomErrors.js";
import { sendOrderEmail } from "../utils/sendEmail.js";
import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";
import asyncHandler from "../middleware/asyncHandler.js";

export const productOwnerMap = async (order) => {
  const productIdSet = new Set();
  for (const item of order.items) {
    const productIdStr =
      item?.product?._id?.toString() || item?.product?.toString();
    if (
      !productIdStr ||
      productIdStr === "undefined" ||
      productIdStr === "null"
    )
      throw new ValidationError("Product cannot be empty");
    if (!mongoose.Types.ObjectId.isValid(item.product)) {
      throw new ValidationError("Invalid product ID");
    }

    productIdSet.add(item.product?.toString());
  }
  if (!productIdSet.size) throw new ValidationError("Order cannot be empty");

  const productIdArray = [...productIdSet];
  const products = await Product.find({
    _id: { $in: productIdArray },
    isDeleted: false,
  }).select("_id owner");

  const productOwnerMap = {};
  for (const product of products) {
    if (!product?.owner?.toString()?.trim()) {
      console.warn(
        `Product ${product._id} has no owner or is not rentable/deleted`,
      );
      continue;
    }

    const ownerId = product.owner?._id
      ? product.owner._id.toString()
      : product.owner?.toString();
    productOwnerMap[product._id?.toString()] = ownerId;
  }

  return productOwnerMap;
};

export const getOrderStats = asyncHandler(async (req, res, next) => {
  const { ownerId, productId } = req.query;

  const ParamfilterOwner = {};
  const ParamfilterItem = {};

  if (ownerId) {
    ParamfilterOwner["ownersData.owner"] = new mongoose.Types.ObjectId(
      String(ownerId),
    );
  }

  if (productId) {
    ParamfilterItem["items.product"] = new mongoose.Types.ObjectId(
      String(productId),
    );
  }

  const basePipeline = (useItemMatch = true) => [
    { $project: { items: 1, customer: 1 } },
    { $unwind: "$items" },
    ...(useItemMatch && productId ? [{ $match: ParamfilterItem }] : []),
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    { $unwind: "$productDoc" },
  ];

  const categoryLookUpPipeline = (useItemMatch = true) => [
    ...basePipeline(useItemMatch),
    {
      $lookup: {
        from: "categories",
        localField: "productDoc.categories",
        foreignField: "_id",
        as: "categoryDoc",
      },
    },
  ];

  const pendingStatuses = ["pending"];
  const approvedStatuses = ["approved", "prepared"];
  const rentedStatuses = ["rented"];
  const returnedStatuses = ["returned"];
  const rejectedStatuses = ["rejected"];

  const requestedQuantityStatuses = ["pending"];
  const assignedQuantityStatuses = [
    "approved",
    "prepared",
    "rented",
    "returned",
  ];

  const disperseQuantity = (status, totalRequested, totalAssigned) => {
    if (requestedQuantityStatuses.includes(status)) {
      return totalRequested ?? 0;
    } else if (assignedQuantityStatuses.includes(status)) {
      return totalAssigned ?? 0;
    } else {
      return totalAssigned ?? totalRequested ?? 0;
    }
  };

  const statisticMap = {};
  const ownersDataStatuses = [
    "changed",
    "pending",
    "approved",
    "prepared",
    "rented",
    "returned",
    "rejected",
  ];
  for (const status of ownersDataStatuses) {
    const statusFilter = { ...ParamfilterOwner, "ownersData.status": status };

    const totalStats = await Order.aggregate([
      { $match: statusFilter },
      ...categoryLookUpPipeline(true),
      {
        $group: {
          _id: null,
          totalRequested: { $sum: "$items.requestedQuantity" },
          totalAssigned: { $sum: "$items.assignedQuantity" },
          totalCategories: { $addToSet: "$categoryDoc.name" },
          totalOwners: { $addToSet: "$items.responsibleOwner" },
        },
      },
    ]);

    const statsPerCategory = await Order.aggregate([
      { $match: statusFilter },
      ...categoryLookUpPipeline(false),
      { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$categoryDoc.name", "No Category"] },
          totalRequested: { $sum: "$items.requestedQuantity" },
          totalAssigned: { $sum: "$items.assignedQuantity" },
        },
      },
    ]);

    const total = totalStats[0] || {
      totalRequested: 0,
      totalAssigned: 0,
      totalCategories: [],
      totalOwners: [],
    };
    const flatCategories = Array.isArray(total.totalCategories)
      ? total.totalCategories.flat()
      : [];
    statisticMap[status] = {
      totalRequested: total.totalRequested,
      totalAssigned: total.totalAssigned,
      totalCategories: flatCategories || [],
      statsPerCategory,
    };
  }

  const response = {};

  const getTotalItemsPerStatus = (statusCheck) => {
    return Object.entries(statisticMap).reduce((sum, [status, s]) => {
      if (statusCheck.includes(status))
        return (
          sum + disperseQuantity(status, s.totalRequested, s.totalAssigned)
        );
      return sum;
    }, 0);
  };

  response.totalItemsRequested = getTotalItemsPerStatus(pendingStatuses);
  response.totalItemsApproved = getTotalItemsPerStatus(approvedStatuses);
  response.totalItemsRented = getTotalItemsPerStatus(rentedStatuses);
  response.totalItemsReturned = getTotalItemsPerStatus(returnedStatuses);
  response.totalItemsRejected = getTotalItemsPerStatus(rejectedStatuses);

  response.statisticMap = {};
  for (const status of ownersDataStatuses) {
    response.statisticMap[status] = statisticMap[status].statsPerCategory;
  }

  response.topProducts = {};
  const topProductsStatuses = {
    pending: pendingStatuses,
    reserved: approvedStatuses,
    rented: rentedStatuses,
    returned: returnedStatuses,
  };

  for (const [status, statusArr] of Object.entries(topProductsStatuses)) {
    const topProductsFilter = {
      ...ParamfilterOwner,
      "ownersData.status": { $in: statusArr },
    };

    const topProducts = await Order.aggregate([
      { $match: topProductsFilter },
      ...basePipeline(false),
      { $match: { "items.status": { $in: statusArr } } },
      {
        $group: {
          _id: "$productDoc.name",
          totalQuantity: {
            $sum:
              status === "pending"
                ? "$items.requestedQuantity"
                : "$items.assignedQuantity",
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);
    response.topProducts[status] = topProducts;
  }

  return res.status(200).json({ success: true, response });
});

export const getOrderStatuses = asyncHandler(async (req, res, next) => {
  return res.json({
    success: true,
    statuses: Order.schema.path("ownersData.status").enumValues,
  });
});

export const getOrders = asyncHandler(async (req, res, next) => {
  const role = req.user.role;
  const userId = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ValidationError("Invalid user ID"));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const status = req.query.status || "";
  const email = req.query.email || "";

  const filter = {};
  if (role === "admin") {
    if (status) {
      filter.ownersData = { $elemMatch: { status } };
    }
  } else {
    const elem = { owner: new mongoose.Types.ObjectId(String(userId)) };
    if (status) elem.status = status;
    filter.ownersData = { $elemMatch: elem };
  }

  if (email) {
    filter["customer.email"] = { $regex: email, $options: "i" };
  }

  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "items.responsibleOwner", select: "name email" })
      .populate({
        path: "items.product",
        select: "name stockTotal stockForRent stockRentedOut owner tags",
      })
      .lean(),
    Order.countDocuments(filter),
  ]);

  const personalizedOrders = orders.map((order) => {
    if (role === "admin") return order;

    const normalizeId = (obj) =>
      obj?._id ? obj._id.toString() : obj?.toString();

    return {
      ...order,
      items: order.items.filter(
        (item) => normalizeId(item.responsibleOwner) === userId,
      ),
      ownersData: order.ownersData.filter(
        (ownersData) => normalizeId(ownersData.owner) === userId,
      ),
    };
  });

  const totalPages = Math.ceil(totalOrders / limit);

  return res
    .status(200)
    .json({
      success: true,
      orders: personalizedOrders,
      page,
      totalPages,
      totalOrders,
    });
});

export const createOrder = asyncHandler(async (req, res, next) => {
  if (!req.body) return next(new BadRequestError("Request body is missing"));

  const { token, customer, items, requestedStartDate, requestedEndDate } =
    req.body || null;

  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecret) {
    const params = new URLSearchParams();
    params.append("secret", recaptchaSecret);
    params.append("response", token || "");

    const reCaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        body: params,
      },
    );
    const reCaptchaData = await reCaptchaResponse.json();
    if (!reCaptchaData.success) {
      return next(new BadRequestError("Recaptcha has to be solved"));
    }
  }

  if (!customer) throw new ValidationError("Customer information is required");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!customer.email || !emailRegex.test(customer.email)) {
    throw new BadRequestError("Invalid email address");
  }

  const indexRegex = /^\d{6}$/;
  if (customer.index && !indexRegex.test(customer.index)) {
    throw new BadRequestError("Index must be only 6 digits");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } })
      .lean()
      .session(session);
    const productMap = {};
    products.forEach((p) => (productMap[p._id.toString()] = p));

    const enrichedItems = items.map((item) => {
      const product = productMap[item.product];
      if (!product)
        throw new ValidationError(`Produkt ${item.product} nie istnieje`);
      if (item.requestedQuantity < 1)
        throw new BadRequestError(`Niepoprawna ilość dla ${product.name}`);

      return {
        ...item,
        responsibleOwner: product.owner,
        status: "pending",
      };
    });

<<<<<<< HEAD
    if (new Date(requestedStartDate) > new Date(requestedEndDate))
      throw new ValidationError(`Start date cannot be after end date`);

    const customerKey = randomBytes(8).toString("hex");
    const encryptedCustomerKey = await bcrypt.hash(customerKey, 10);

    const order = new Order({
      customerKey: encryptedCustomerKey,
=======
    const order = await Order.create({
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
      customer,
      items: enrichedItems,
      requestedStartDate,
      requestedEndDate,
      status: "pending",
<<<<<<< HEAD
      isNew: true,
=======
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
    });

    let successSave = false;
    let attempt = 0;
    const maxAttempts = 10;

    while (!successSave && attempt < maxAttempts) {
      try {
        order.uuid = uuidv4();
        await order.save({ session });
        successSave = true;
      } catch (error) {
        if (error.code === 11000 && error.keyPattern?.uuid) {
          console.warn(`UUID exists: ${order.uuid}`);
          attempt++;
          continue;
        }
        throw error;
      }
    }

    if (!successSave) {
      throw new ServerError(
        `Failed to save order after ${maxAttempts} UUID attempts`,
      );
    }

    await sendOrderEmail(order, customerKey, order.uuid);

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json({ success: true, message: "Order created", order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const updateOrder = asyncHandler(async (req, res, next) => {
  if (!req.body) {
    return next(new BadRequestError("Request body is missing"));
  }

  const { orderId } = req.params;
  let { itemUpdates } = req.body;
  const { assignedStartDate, assignedEndDate } = req.body;

  const processableStatuses = ["pending", "approved", "prepared"];
  const rentedStatuses = ["rented"];
  const reservedStatuses = ["approved", "prepared"];

  if (!Array.isArray(itemUpdates)) {
    itemUpdates = [itemUpdates];
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new ResourceNotFoundError("Order");
    order._isUpdate = true;

    if (assignedStartDate && assignedEndDate) {
      const newAssignedStartDate = new Date(assignedStartDate);
      const newAssignedEndDate = new Date(assignedEndDate);

      if (new Date(newAssignedStartDate) > new Date(newAssignedEndDate)) {
        throw new ValidationError(`Invalid date range`);
      }

      order._newAssignedStartDate = newAssignedStartDate;
      order._newAssignedEndDate = newAssignedEndDate;
    }

    const currentItemsMap = {};
    for (const item of order.items) {
      currentItemsMap[item._id.toString()] = item;
    }

    const productChanges = {
      rented: new Map(),
      reserved: new Map(),
    };

    function applyDelta({
      map,
      deltaKey,
      prevStatus,
      newStatus,
      statuses,
      quantity,
    }) {
      const hasNewStatus = statuses.includes(newStatus);
      const hasPrevStatus = statuses.includes(prevStatus);

      if (hasNewStatus && !hasPrevStatus) {
        map.set(deltaKey, (map.get(deltaKey) ?? 0) + (quantity ?? 0));
      } else if (!hasNewStatus && hasPrevStatus) {
        map.set(deltaKey, (map.get(deltaKey) ?? 0) - (quantity ?? 0));
      }
    }

    for (const itemUpdate of itemUpdates) {
      const item = currentItemsMap[itemUpdate.itemId];
      if (!item) {
        console.warn(
          `Skipping update for non-existing item ${itemUpdate.itemId}`,
        );
        continue;
      }

      const prevStatus = item.status;
      if (prevStatus === itemUpdate.newStatus) continue;

      if (processableStatuses.includes(itemUpdate.newStatus)) {
        if (
          itemUpdate.assignedQuantity == null ||
          itemUpdate.assignedQuantity <= 0
        ) {
          throw new ValidationError(`Quantity must be greater than 0`);
        }
        item.assignedQuantity = itemUpdate.assignedQuantity;
      }

      item.status = itemUpdate.newStatus;
      const deltaKey = item.product.toString();

      applyDelta({
        map: productChanges.rented,
        deltaKey,
        prevStatus,
        newStatus: itemUpdate.newStatus,
        statuses: rentedStatuses,
        quantity: item.assignedQuantity,
      });

      applyDelta({
        map: productChanges.reserved,
        deltaKey,
        prevStatus,
        newStatus: itemUpdate.newStatus,
        statuses: reservedStatuses,
        quantity: item.assignedQuantity,
      });
    }

    function applyProductDelta({ product, delta, field, limit, label }) {
      if (!delta) return;

      product[field] = (product[field] || 0) + delta;

      if (product[field] < 0) {
        console.warn(`${label} for ${product.name} below zero`, product);
      }
    }

    const productIds = Array.from(
      new Set([
        ...productChanges.rented.keys(),
        ...productChanges.reserved.keys(),
      ]),
    );

    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } }).session(
        session,
      );

      for (const product of products) {
        const rentedDelta =
          productChanges.rented.get(product._id.toString()) ?? 0;
        const reservedDelta =
          productChanges.reserved.get(product._id.toString()) ?? 0;

        applyProductDelta({
          product,
          delta: reservedDelta,
          field: "stockReserved",
          limit: product.stockForRent - product.stockRentedOut,
          label: "Stock reserved",
        });

        applyProductDelta({
          product,
          delta: rentedDelta,
          field: "stockRentedOut",
          limit: product.stockForRent - product.stockReserved,
          label: "Stock rented",
        });

        await product.save({ session });
      }
    }

    await order.save({ session });

    await sendOrderEmail(order);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const hardDeleteOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return next(new BadRequestError("Invalid order ID"));
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ResourceNotFoundError("Order"));
  }

  const updatedProduct = await Product.findOneAndUpdate(
    { _id: order.product, isDeleted: false },
    { $inc: { stockTotal: order.quantity } },
    { new: true, runValidators: true },
  );
  if (!updatedProduct) {
    console.warn(
      `Product ${order.product} does not exist. Order ${orderId} will still be deleted.`,
    );
  }

  await order.deleteOne();

  return res
    .status(200)
    .json({ success: true, message: "Order deleted and stockTotal updated" });
});

export const getCustomerOrder = asyncHandler(async (req, res, next) => {
  const { orderUUID } = req.params;
  const secret = req.headers["x-order-secret"];
  if (!orderUUID)
    return res
      .status(400)
      .json({ success: false, message: "Missing order UUID" });
  if (!secret)
    return res
      .status(401)
      .json({ success: false, message: "Missing access code" });

  const order = await Order.findOne({ uuid: orderUUID })
    .populate({ path: "items.responsibleOwner", select: "name" })
    .populate({ path: "items.product", select: "name" })
    .lean();
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Order doesn't exist" });

  const isMatch = await bcrypt.compare(secret, order.customerKey);
  if (!isMatch)
    return res
      .status(403)
      .json({ success: false, message: "Invalid access code" });

  return res.status(200).json({ success: true, order });
});

export const customerUpdateOrder = asyncHandler(async (req, res, next) => {
  if (!req.body) return next(new BadRequestError("Request missing body"));

  const { orderID } = req.params;
  const secret = req.headers["x-order-secret"];
  if (!orderID)
    return res
      .status(400)
      .json({ success: false, message: "Missing order ID" });
  if (!secret)
    return res
      .status(401)
      .json({ success: false, message: "Missing access code" });

  const { ownerId, customerApproval } = req.body;

  const order = await Order.findById(orderID);
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Order doesn't exist" });

  const isMatch = await bcrypt.compare(secret, order.customerKey);
  if (!isMatch)
    return res
      .status(403)
      .json({ success: false, message: "Invalid access code" });

  const ownerData = order.ownersData.find(
    (od) =>
      od.owner?.toString() === ownerId?.toString() && od.status === "approved",
  );
  if (ownerData) ownerData.customerApproval = customerApproval;

  if (!customerApproval) {
    order.items.forEach((item) => {
      if (item.responsibleOwner?.toString() === ownerId?.toString()) {
        item.status = "rejected";
      }
    });
  }

  await order.save();

  return res.status(200).json({ success: true, order });
});
