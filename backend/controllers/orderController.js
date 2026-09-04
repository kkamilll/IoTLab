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
  PermissionError,
} from "../errors/CustomErrors.js";
import { sendOrderEmail, sendOwnerNotificationEmail } from "../utils/sendEmail.js";
import { createNotification } from "./notificationController.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";
import asyncHandler from "../middleware/asyncHandler.js";



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
  const ownerId = req.query.ownerId || "";
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
  const dateFrom = req.query.dateFrom || "";
  const dateTo = req.query.dateTo || "";
  const index = req.query.index || "";
  const yearOfStudy = req.query.yearOfStudy || "";
  const semester = req.query.semester || "";
  const fieldOfStudy = req.query.fieldOfStudy || "";

  const filter = {};
  if (role === "admin") {
    if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
      const elem = { owner: new mongoose.Types.ObjectId(String(ownerId)) };
      if (status) elem.status = status;
      filter.ownersData = { $elemMatch: elem };
    } else if (status) {
      filter.ownersData = { $elemMatch: { status } };
    }
  } else {
    const elem = { owner: new mongoose.Types.ObjectId(String(userId)) };
    if (status) elem.status = status;
    filter.ownersData = { $elemMatch: elem };
  }

  if (email) {
    const searchTerm = email.startsWith("#") ? email.slice(1) : email;
    filter.$or = [
      { "customer.email": { $regex: searchTerm, $options: "i" } },
      { uuid: { $regex: searchTerm, $options: "i" } }
    ];
  }
  if (index) {
    filter["customer.index"] = { $regex: index, $options: "i" };
  }
  if (yearOfStudy) {
    const parsedYear = parseInt(yearOfStudy);
    if (!isNaN(parsedYear)) filter["customer.yearOfStudy"] = parsedYear;
  }
  if (semester) {
    const parsedSem = parseInt(semester);
    if (!isNaN(parsedSem)) filter["customer.semester"] = parsedSem;
  }
  if (fieldOfStudy) {
    filter["customer.fieldOfStudy"] = { $regex: fieldOfStudy, $options: "i" };
  }

  if (dateFrom || dateTo) {
    filter.requestedStartDate = {};
    if (dateFrom) filter.requestedStartDate.$gte = new Date(dateFrom);
    if (dateTo) filter.requestedStartDate.$lte = new Date(dateTo);
  }

  const buildStatusFilter = (targetStatus) => {
    const statFilter = { ...filter };
    if (role === "admin") {
      if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
        statFilter.ownersData = { $elemMatch: { owner: new mongoose.Types.ObjectId(String(ownerId)), status: targetStatus } };
      } else {
        statFilter.ownersData = { $elemMatch: { status: targetStatus } };
      }
    } else {
      statFilter.ownersData = { $elemMatch: { owner: new mongoose.Types.ObjectId(String(userId)), status: targetStatus } };
    }
    return statFilter;
  };

  const [orders, totalOrders, pendingCount, rentedCount, lateCount] = await Promise.all([
    Order.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate({ path: "items.responsibleOwner", select: "name email" })
      .populate({
        path: "items.product",
        select: "name stockTotal stockForRent stockRentedOut owner tags",
      })
      .lean(),
    Order.countDocuments(filter),
    Order.countDocuments(buildStatusFilter("pending")),
    Order.countDocuments(buildStatusFilter("rented")),
    Order.countDocuments(buildStatusFilter("late")),
  ]);

  const personalizedOrders = orders.map((order) => {
    if (role === "admin" && !ownerId) return order;

    const filterUserId = (role === "admin" && ownerId) ? ownerId : userId;
    const normalizeId = (obj) =>
      obj?._id ? obj._id.toString() : obj?.toString();

    return {
      ...order,
      items: order.items.filter(
        (item) => normalizeId(item.responsibleOwner) === filterUserId,
      ),
      ownersData: order.ownersData.filter(
        (ownersData) => normalizeId(ownersData.owner) === filterUserId,
      ),
    };
  });

  const totalPages = Math.ceil(totalOrders / limit);

  return res.status(200).json({
    success: true,
    orders: personalizedOrders,
    page,
    totalPages,
    totalOrders,
    stats: {
      total: totalOrders,
      pending: pendingCount,
      rented: rentedCount,
      late: lateCount,
    },
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

  const requiredCustomerFields = [
    "firstName",
    "lastName",
    "index",
    "semester",
    "yearOfStudy",
    "fieldOfStudy",
    "phoneNumber",
    "email",
    "purpose",
  ];
  for (const field of requiredCustomerFields) {
    if (customer[field] == null || (typeof customer[field] === "string" && customer[field].trim() === "")) {
      throw new ValidationError(`Customer field '${field}' is required`);
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    throw new BadRequestError("Invalid email address");
  }

  const indexRegex = /^\d{6}$/;
  if (!indexRegex.test(customer.index)) {
    throw new BadRequestError("Index must be only 6 digits");
  }

  const phoneRegex = /^\d{9,10}$/;
  if (!phoneRegex.test(customer.phoneNumber)) {
    throw new BadRequestError("Phone number must be 9–10 digits");
  }

  try {
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } })
      .lean();
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

    const start = new Date(requestedStartDate);
    const end = new Date(requestedEndDate);
    const bufferTime = new Date(Date.now() - 60000); // 1-minute buffer

    if (start < bufferTime) {
      throw new ValidationError(`Start date cannot be in the past`);
    }
    if (end <= start) {
      throw new ValidationError(`Start date must be before end date`);
    }

    const customerKey = randomBytes(8).toString("hex");
    const encryptedCustomerKey = await bcrypt.hash(customerKey, 10);

    const order = new Order({
      customerKey: encryptedCustomerKey,
      customer,
      items: enrichedItems,
      requestedStartDate,
      requestedEndDate,
      status: "pending",
      isNew: true,
    });

    let successSave = false;
    let attempt = 0;
    const maxAttempts = 10;

    while (!successSave && attempt < maxAttempts) {
      try {
        order.uuid = uuidv4();
        await order.save();
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

    const ownerIds = [...new Set(enrichedItems.map((i) => i.responsibleOwner?.toString()).filter(Boolean))];
    if (ownerIds.length > 0) {
      const owners = await User.find({ _id: { $in: ownerIds } }, "email");
      for (const owner of owners) {
        if (owner.email) {
          await sendOwnerNotificationEmail(owner.email, order);
        }
        
        const ownerItems = enrichedItems.filter(
          (i) => i.responsibleOwner?.toString() === owner._id.toString()
        );
        const itemDetails = ownerItems
          .map((item) => {
            const product = products.find((p) => p._id.toString() === item.product.toString());
            return `${product ? product.name : "Nieznany produkt"} (ilość: ${item.requestedQuantity})`;
          })
          .join(", ");

        const startDateFormatted = new Date(requestedStartDate).toLocaleDateString("pl-PL");
        const endDateFormatted = new Date(requestedEndDate).toLocaleDateString("pl-PL");

        const richMessage = `Otrzymałeś nowe zamówienie od ${customer.firstName} ${customer.lastName} (${customer.email}).\n` +
          `Sprzęt: ${itemDetails}.\n` +
          `Termin: ${startDateFormatted} do ${endDateFormatted}.\n` +
          `Cel wypożyczenia: ${customer.purpose || "Nie podano"}.`;

        await createNotification({
          user: owner._id,
          type: "ORDER_CREATED",
          title: "Nowe zamówienie",
          message: richMessage,
          relatedOrder: order._id,
        });
      }
    }

    return res
      .status(201)
      .json({ success: true, message: "Order created", order });
  } catch (error) {
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

  try {
    const order = await Order.findById(orderId);
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

      if (["approved", "prepared", "rented"].includes(itemUpdate.newStatus)) {
        const itemOwnerId = item.responsibleOwner?.toString();
        const existingOwnerData = order.ownersData?.find(
          (od) => od.owner?.toString() === itemOwnerId
        );

        const effStart = assignedStartDate 
          ? new Date(assignedStartDate) 
          : (existingOwnerData?.assignedStartDate || order.requestedStartDate);
        
        const effEnd = assignedEndDate 
          ? new Date(assignedEndDate) 
          : (existingOwnerData?.assignedEndDate || order.requestedEndDate);

        if (new Date(effStart) >= new Date(effEnd)) {
          throw new ValidationError(`Start date must be before end date`);
        }
      }

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

    let productsForNotif = [];
    if (productIds.length > 0) {
      productsForNotif = await Product.find({ _id: { $in: productIds } });

      for (const product of productsForNotif) {
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

        await product.save();
      }
    }

    await order.save();

    await sendOrderEmail(order);

    let statusMsg = "Zmieniono status elementów w zamówieniu.";
    if (productsForNotif.length > 0) {
      const statusChanges = [];
      for (const itemUpdate of itemUpdates) {
        const item = currentItemsMap[itemUpdate.itemId];
        if (!item) continue;
        const prod = productsForNotif.find(p => p._id.toString() === item.product.toString());
        if (prod) {
          statusChanges.push(`${prod.name} (${itemUpdate.newStatus})`);
        }
      }
      if (statusChanges.length > 0) {
        statusMsg = `Sprzęt: ${statusChanges.join(", ")}`;
      }
    }

    const adminUsers = await User.find({ role: "admin" }, "_id").lean();
    const adminIds = adminUsers.map((a) => a._id.toString());

    const ownersToNotify = new Set([
      ...order.items.map((i) => i.responsibleOwner?.toString()).filter(Boolean),
      ...adminIds,
      req.user._id.toString()
    ]);

    const finalStatusMsg = `Użytkownik ${req.user.name} zmienił status w zamówieniu (ID: ${order.uuid.substring(0, 8)}...).\n${statusMsg}`;

    for (const userId of ownersToNotify) {
      await createNotification({
        user: userId,
        type: "STATUS_CHANGED",
        title: "Zmiana statusu",
        message: finalStatusMsg,
        relatedOrder: order._id,
      });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    throw error;
  }
});

export const hardDeleteOrder = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new PermissionError("Only admins can delete orders"));
  }

  const { orderId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return next(new BadRequestError("Invalid order ID"));
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ResourceNotFoundError("Order"));
  }

  // Build per-product stock delta maps based on item statuses
  const reservedDelta = new Map();   // approved / prepared → stockReserved
  const rentedDelta   = new Map();   // rented             → stockRentedOut

  for (const item of order.items) {
    const pid = item.product?.toString();
    if (!pid) continue;
    const qty = item.assignedQuantity ?? 0;

    if (["approved", "prepared"].includes(item.status)) {
      reservedDelta.set(pid, (reservedDelta.get(pid) ?? 0) + qty);
    } else if (["rented", "late"].includes(item.status)) {
      rentedDelta.set(pid, (rentedDelta.get(pid) ?? 0) + qty);
    }
  }

  const allProductIds = [
    ...new Set([...reservedDelta.keys(), ...rentedDelta.keys()]),
  ];

  if (allProductIds.length > 0) {
    const products = await Product.find({ _id: { $in: allProductIds } });
    for (const product of products) {
      const pid = product._id.toString();
      const rDelta = reservedDelta.get(pid) ?? 0;
      const oDelta = rentedDelta.get(pid) ?? 0;

      if (rDelta !== 0) {
        product.stockReserved = Math.max(0, (product.stockReserved || 0) - rDelta);
      }
      if (oDelta !== 0) {
        product.stockRentedOut = Math.max(0, (product.stockRentedOut || 0) - oDelta);
      }

      if (rDelta !== 0 || oDelta !== 0) await product.save();
    }
  }

  await order.deleteOne();

  return res
    .status(200)
    .json({ success: true, message: "Order deleted and stock updated" });
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

  const { orderId } = req.params;
  const secret = req.headers["x-order-secret"];
  if (!orderId)
    return res
      .status(400)
      .json({ success: false, message: "Missing order ID" });
  if (!secret)
    return res
      .status(401)
      .json({ success: false, message: "Missing access code" });

  const { ownerId, customerApproval } = req.body;

  const order = await Order.findById(orderId);
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

export const downloadPDF = asyncHandler(async (req, res, next) => {
  const { base64Data, filename } = req.body;
  if (!base64Data || !filename) {
    return next(new BadRequestError("Missing base64Data or filename"));
  }
  const buffer = Buffer.from(base64Data, "base64");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  return res.send(buffer);
});
