import Product from "../models/Product.js";
import Order from "../models/Order.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { AppError, ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ConflictError, ServerError } from '../errors/CustomErrors.js'
// import { validateRequiredFields } from '../utils/validateRequiredFields.js'

import { handleOrderEmail } from "../utils/sendOrderEmail.js";

import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";

export const productOwnerMap = async (order) => {
  const productIdSet = new Set();
  for (const item of order.items) {
    const productIdStr = item?.product?._id?.toString() || item?.product?.toString();
    if (!productIdStr || productIdStr === "undefined" || productIdStr === "null") throw new ValidationError("Product cannot be empty");
    if (!mongoose.Types.ObjectId.isValid(item.product)) {
      throw new ValidationError("Invalid product ID");
    }

    productIdSet.add(item.product?.toString());
  }
  if (!productIdSet.size) throw new ValidationError("Order cannot be empty");

  const productIdArray = [...productIdSet];
  const products = await Product.find({ _id: { $in: productIdArray }, isDeleted: false }).select("_id owner");

  const productOwnerMap = {};
  for (const product of products) {
    if (!product?.owner?.toString()?.trim()) {
      console.warn(`Product ${product._id} has no owner or is not rentable/deleted`);
      continue;
      // throw new ConflictError("Order contains products with missing owners");
    }
    // if (!mongoose.Types.ObjectId.isValid(product.owner)) {
    //   throw new ValidationError("Invalid owner ID");
    // }

    const ownerId = product.owner?._id ? product.owner._id.toString() : product.owner?.toString();
    productOwnerMap[product._id?.toString()] = ownerId;
  }

  return productOwnerMap;
}

// const groupOrders = async (order) => {
//   const productOwnerMap = await productOwnerMap(order);

//   const groupedOrders = {};
//   for (const item of order.items) {
//     const owner = productOwnerMap[item.product];
//     if (!owner) throw new ConflictError("Order contains products with missing owners");

//     if (!groupedOrders[owner]) {
//       groupedOrders[owner] = {
//         customer: order.customer,
//         items: []
//       };
//     }

//     groupedOrders[owner].items.push(item);
//   }
//   const newGroupedOrders = Object.values(groupedOrders);

//   for (const newGroupedOrder of newGroupedOrders) {
//     for (const item of newGroupedOrder.items) {
//       const product = await Product.findById(item.product);
//       if (!product) {
//         return res.status(404).json({ message: `Produkt ${item.product} nie istnieje` });
//       }

//       if (item.requested.quantity < 1) {
//         return res.status(400).json({ message: `Niepoprawna ilość dla ${product.name}` });
//       }

//       if (new Date(item.requested.startDate) > new Date(item.requested.endDate)) {
//         return res.status(400).json({ message: `Niepoprawne daty dla ${product.name}` });
//       }
//     }
//   }

//   return newGroupedOrders;
// }

export const getOrderStatuses = (req, res, next) => {
  try {
    res.json({ success: true, statuses: Order.schema.path("ownersData.status").enumValues });
  } catch {
    return next(new ServerError({ message: `Error fetching orders: ${error.message}` }));
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ValidationError("Invalid user ID"));
    }

    // Pagination parameters (defaults)
    const page = parseInt(req.query.page) || 1;      // page number, 1-based
    const limit = parseInt(req.query.limit) || 50;   // items per page
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
      Order.find(filter) // fetch all, frontend will filter returned
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "items.responsibleOwner", select: "name email" })
        .populate({ path: "items.product", select: "name stockTotal stockForRent stockRentedOut owner tags" })
        .lean(),
      Order.countDocuments(filter)
    ]);

    const personalizedOrders = orders.map(order => {
      if (role === "admin") return order;

      const normalizeId = (obj) => (obj?._id ? obj._id.toString() : obj?.toString());

      return {
        ...order,
        items: order.items.filter(
          item => normalizeId(item.responsibleOwner) === userId
        ),
        ownersData: order.ownersData.filter(
          ownersData => normalizeId(ownersData.owner) === userId
        )
      };
    });

    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({ success: true, orders: personalizedOrders, page, totalPages, totalOrders });
  } catch (error) {
    return next(new ServerError({ message: `Error fetching orders: ${error.message}` }));
  }
};

export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.body) return next(new BadRequestError("Request body is missing"));

    const { token, customer, items, requestedStartDate, requestedEndDate } = req.body || null;

    const reCaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      { method: "POST" }
    );
    const reCaptchaData = await reCaptchaResponse.json();
    if (!reCaptchaData.success) {
      return next(new BadRequestError("Recaptcha has to be solved"));
    }

    if (!customer) throw new ValidationError("Customer information is required");
    // if (!customer.name?.trim()) {
    //   throw new ValidationError("Customer name is required");
    // }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customer.email || !emailRegex.test(customer.email)) {
      throw new BadRequestError("Invalid email address");
    }

    const indexRegex = /^\d{6}$/;
    if (!customer.index || !indexRegex.test(customer.index)) {
      throw new BadRequestError("Index must be only 6 digits");
    }

    // Fetch all products in one query
    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } }).lean().session(session);
    const productMap = {};
    products.forEach(p => productMap[p._id.toString()] = p);

    // Enrich items
    const enrichedItems = items.map(item => {
      const product = productMap[item.product];
      if (!product) throw new ValidationError(`Produkt ${item.product} nie istnieje`);
      if (item.requestedQuantity < 1) throw new BadRequestError(`Niepoprawna ilość dla ${product.name}`);

      return {
        ...item,
        responsibleOwner: product.owner,
        status: "pending",
        // isReturned: false
      };
    });

    if (new Date(requestedStartDate) > new Date(requestedEndDate))
      throw new Error(`Start date cannot be after end date`);

    const customerKey = randomBytes(8).toString("hex");
    const order = new Order({
      customerKey,
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
      throw new ServerError(`Failed to save order after ${maxAttempts} UUID attempts`);
    }

    await session.commitTransaction();
    session.endSession();

    // console.log("New Order: Calling handleOrderEmail?");
    await handleOrderEmail(order, customerKey, order.uuid);

    res.status(201).json({ success: true, message: "Order created", order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.warn(error);
    if (error instanceof AppError) throw error;

    return next(new ServerError({ message: error.message }));
  }
};

export const updateOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.body) {
      return next(new BadRequestError("Request body is missing"));
    }

    const { orderId } = req.params;
    let { itemUpdates } = req.body;
    const { assignedStartDate, assignedEndDate } = req.body;

    const processableStatuses = ["pending", "approved", "prepared"];
    const rentedStatuses = ['rented'];
    const reservedStatuses = ["approved", "prepared"];

    // normalize to array
    if (!Array.isArray(itemUpdates)) {
      itemUpdates = [itemUpdates];
    }

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

    function applyDelta({ map, deltaKey, prevStatus, newStatus, statuses, quantity }) {
      const hasNewStatus = statuses.includes(newStatus);
      const hasPrevStatus = statuses.includes(prevStatus);

      if (hasNewStatus && !hasPrevStatus) {
        map.set(deltaKey, (map.get(deltaKey) ?? 0) + (quantity ?? 0));
        return;
      } else if (!hasNewStatus && hasPrevStatus) {
        map.set(deltaKey, (map.get(deltaKey) ?? 0) - (quantity ?? 0));
        return;
      }
    }

    for (const itemUpdate of itemUpdates) {
      const item = currentItemsMap[itemUpdate.itemId];
      if (!item) {
        console.warn(`Skipping update for non-existing item ${itemUpdate.itemId}`);
        continue;
      }

      const prevStatus = item.status;
      if (prevStatus === itemUpdate.newStatus) continue; // nothing to do

      // validate assignedQuantity if provided
      if (processableStatuses.includes(itemUpdate.newStatus)) {
        if (itemUpdate.assignedQuantity == null && itemUpdate.assignedQuantity <= 0) {
          throw new ValidationError(`Quantity must be greater than 0`);
        }
        item.assignedQuantity = itemUpdate.assignedQuantity;
      }

      item.status = itemUpdate.newStatus;

      const deltaKey = item.product.toString();
      // const delta = productStockChanges.get(deltaKey) || 0;

      // if (itemUpdate.newStatus === "rented") {
      //   const currentDelta = productStockChanges.get(deltaKey) ?? 0;
      //   productStockChanges.set(deltaKey, currentDelta + (item.assignedQuantity ?? 0));
      // }

      // if (prevStatus === "rented") {
      //   const currentDelta = productStockChanges.get(deltaKey) ?? 0;
      //   productStockChanges.set(deltaKey, currentDelta - (item.assignedQuantity ?? 0));
      // }

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
        console.warn((`${label} for ${product.name} below zero`, product));
        // throw new ConflictError(`${label} for ${product.name} below zero`);
      }

      if (limit !== undefined && product[field] > limit) {
        console.warn((`${label} for ${product.name} exceeded`));
        // throw new ConflictError(`${label} for ${product.name} exceeded`);
      }
    }

    // batch load products
    // const productIds = [...productStockChanges.keys()];
    const productIds = Array.from(new Set([
      ...productChanges.rented.keys(),
      ...productChanges.reserved.keys()
    ]));

    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } }).session(session);

      for (const product of products) {
        const rentedDelta = productChanges.rented.get(product._id.toString()) ?? 0;
        const reservedDelta = productChanges.reserved.get(product._id.toString()) ?? 0;

        // const delta = productStockChanges.get(product._id.toString());
        // if (!delta) continue;

        // product.stockRentedOut = (product.stockRentedOut || 0) + delta;

        // if (product.stockRentedOut < 0) {
        //   throw new ConflictError(`Stock for ${product.name} below zero`);
        // }
        // if (product.stockRentedOut > product.stockForRent) {
        //   throw new ConflictError(`Stock for ${product.name} exceeded`);
        // }

        applyProductDelta({
          product,
          delta: reservedDelta,
          field: "stockReserved",
          limit: product.stockForRent - product.stockRentedOut,
          label: "Stock reserved"
        });

        applyProductDelta({
          product,
          delta: rentedDelta,
          field: "stockRentedOut",
          limit: product.stockForRent - product.stockReserved,
          label: "Stock rented"
        });

        await product.save({ session });
      }
    }

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    // console.log("Update Order: Calling handleOrderEmail?");
    await handleOrderEmail(order);

    res.status(200).json({ success: true, order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};


// TODO: add transaction
// export const returnOrder = async (req, res, next) => {
//   try {
//     const { orderId } = req.body;
//     if (!mongoose.Types.ObjectId.isValid(orderId)) {
//       return next(new BadRequestError("Invalid order ID"));
//     }

//     const order = await Order.findOneAndUpdate({ _id: orderId, isReturned: false }, { isReturned: true }, { new: true });
//     // if (!order) return res.status(404).json({ success: false, error: "Zamówienie nie istnieje" });
//     if (!order) return next(new BadRequestError("Order not found or already returned"));

//     // przywracamy stock produktu
//     const updatedProduct = await Product.findByIdAndUpdate(order.product, { $inc: { stockTotal: order.quantity } }, { runValidators: true });
//     if (!updatedProduct) {
//       console.warn(`Product ${order.product} does not exist. Order ${orderId} will still be returned.`);
//     }

//     res.status(200).json({ success: true, message: "Zamówienie zwrócone", order });
//   } catch (error) {
//     return next(new ServerError({ message: `Error returning orders: ${error.message}` }));
//   }
// };

export const hardDeleteOrder = async (req, res, next) => {
  // add transaction, still race condition possible?
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new BadRequestError("Invalid order ID"));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new ResourceNotFoundError("Order"));
    }

    const updatedProduct = await Product.findOneAndUpdate({ _id: order.product, isDeleted: false }, { $inc: { stockTotal: order.quantity } }, { new: true, runValidators: true });
    if (!updatedProduct) {
      console.warn(`Product ${order.product} does not exist. Order ${orderId} will still be deleted.`);
    }

    await order.deleteOne();

    return res.status(200).json({ success: true, message: "Order deleted and stockTotal updated" });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const getCustomerOrder = async (req, res, next) => {
  try {
    const { orderUUID } = req.params;
    if (!orderUUID) return res.status(400).json({ success: false, message: "Missing order ID" });

    const order = await Order.findOne({ uuid: orderUUID })
      .populate({ path: "items.responsibleOwner", select: "name" })
      .populate({ path: "items.product", select: "name" })
      .lean();
    if (!order) return res.status(404).json({ success: false, message: "Order doesn't exist" });

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Błąd wysyłki maila:", err);
    return res.status(500).json({ success: false, message: "Error sending mail" });
  }
};

export const customerUpdateOrder = async (req, res, next) => {
  try {
    if (!req.body) return next(new BadRequestError("Request missing body"));

    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ success: false, message: "Missing order ID" });

    const { ownerId, customerApproval } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order doesn't exist" });

    // Update ownersData
    const ownerData = order.ownersData.find(od => od.owner?.toString() === ownerId?.toString() && od.status === "approved");
    if (ownerData) ownerData.customerApproval = customerApproval;

    // Optionally update items if customer rejected
    if (!customerApproval) {
      order.items.forEach(item => {
        if (item.responsibleOwner?.toString() === ownerId?.toString()) {
          item.status = "rejected";
        }
      });
    }

    // console.log(order);
    await order.save();

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ success: false, message: "Error updating order" });
  }
};