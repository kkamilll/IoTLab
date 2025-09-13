import Product from "../models/Product.js";
import Order from "../models/Order.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { AppError, ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ConflictError, ServerError } from '../errors/CustomErrors.js'
// import { validateRequiredFields } from '../utils/validateRequiredFields.js'

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
        .populate({ path: "items.product", select: "name stockTotal stockForRent stockRentedOut owner tag" })
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
    if (!customer.name?.trim()) {
      throw new ValidationError("Customer name is required");
    }
    
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

    const order = new Order({
      customer,
      items: enrichedItems,
      requestedStartDate,
      requestedEndDate,
      status: "pending",
    });
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

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
    
    // normalize to array
    if (!Array.isArray(itemUpdates)) {
      itemUpdates = [itemUpdates];
    }

    const order = await Order.findById(orderId).session(session);
    if (!order) throw new ResourceNotFoundError("Order");

    if(assignedStartDate && assignedEndDate) {
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

    const productStockChanges = new Map();

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
        if (itemUpdate.assignedQuantity <= 0) {
          throw new ValidationError(`Quantity must be greater than 0`);
        }
        item.assignedQuantity = itemUpdate.assignedQuantity;
      }

      item.status = itemUpdate.newStatus;

      const deltaKey = item.product.toString();
      // const delta = productStockChanges.get(deltaKey) || 0;

      if (itemUpdate.newStatus === "rented") {
        const currentDelta = productStockChanges.get(deltaKey) ?? 0;
        productStockChanges.set(deltaKey, currentDelta + (item.assignedQuantity ?? 0));
      }
      if (prevStatus === "rented") {
        const currentDelta = productStockChanges.get(deltaKey) ?? 0;
        productStockChanges.set(deltaKey, currentDelta - (item.assignedQuantity ?? 0));
      }
    }

    // batch load products
    const productIds = [...productStockChanges.keys()];
    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } }).session(session);

      for (const product of products) {
        const delta = productStockChanges.get(product._id.toString());
        if (!delta) continue;

        product.stockRentedOut = (product.stockRentedOut || 0) + delta;

        if (product.stockRentedOut < 0) {
          throw new ConflictError(`Stock for ${product.name} below zero`);
        }
        if (product.stockRentedOut > product.stockForRent) {
          throw new ConflictError(`Stock for ${product.name} exceeded`);
        }

        await product.save({ session });
      }
    }

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

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

export const sendOrderEmail = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "Brak ID zamówienia" });

    const order = await Order.findById(orderId)
      .populate("items.product")
    if (!order) return res.status(404).json({ success: false, message: "Zamówienie nie istnieje" });

    const email = order.customerEmail || order.customer?.email;
    if (!email) return res.status(400).json({ success: false, message: "Brak e-maila klienta" });

    // await sendEmail(email, "Twoje zamówienie", message);
    return res.status(200).json({ success: true, message: "Zamówienie wysłane na maila" });
  } catch (err) {
    console.error("Błąd wysyłki maila:", err);
    return res.status(500).json({ success: false, message: "Błąd wysyłki maila" });
  }
};

// export const updateOrderQuantity = async (req, res) => {
//   try {
//     const { orderId, itemId, quantity } = req.body;
//     if (!orderId || !itemId || !quantity || quantity <= 0) {
//       return res.status(400).json({ error: "Brak danych lub nieprawidłowa ilość" });
//     }

//     const order = await Order.findByIdAndUpdate(orderId, {
//       $set: {
//         "items.$[elem].confirmed.quantity": quantity
//       }
//     },
//       {
//         new: true, // return updated doc
//         arrayFilters: [{ "elem.product": itemId }] // match correct item in array
//       });

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }
//     const updatedItem = order.items.find(
//       (item) => item.product.toString() === itemId.toString()
//     );
//     // const item = order.items.find(i => i.product?._id.toString() === itemId.toString());
//     // if (!item) return res.status(404).json({ error: "Produkt nie znaleziony w zamówieniu" });

//     // const oldQuantity = order.quantity;
//     // item.quantity = quantity;

//     // order.history.push({
//     //   action: "quantity_update",
//     //   quantity,
//     //   productName: item.product?.name || item.productName,
//     //   timestamp: new Date(),
//     // });

//     // await order.save();

//     res.json({ success: true, order, message: `Zmieniono ilość z ${updatedItem?.requested?.quantity} na ${updatedItem?.confirmed?.quantity}` });
//   } catch (err) {
//     console.error("Błąd aktualizacji ilości:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

// export const updateOrderDates = async (req, res) => {
//   try {
//     const { orderId, itemId, startDate, endDate } = req.body;

//     if (!orderId || !startDate || !endDate) {
//       return res.status(400).json({ error: "Brak danych do aktualizacji" });
//     }

//     if (new Date(startDate) > new Date(endDate)) {
//       return res.status(400).json({ error: "Data rozpoczęcia nie może być późniejsza niż data zakończenia" });
//     }

//     // const order = await Order.findById(orderId);
//     const order = await Order.findByIdAndUpdate(orderId, {
//       $set: {
//         "items.$[elem].confirmed.startDate": startDate,
//         "items.$[elem].confirmed.endDate": endDate,
//       }
//     },
//       {
//         new: true, // return updated doc
//         arrayFilters: [{ "elem.product": itemId }] // match correct item in array
//       });
//     if (!order) return res.status(404).json({ error: "Zamówienie nie znalezione" });
//     const updatedItem = order.items.find(
//       (item) => item.product.toString() === itemId.toString()
//     );

//     const oldStart = updatedItem?.requested?.startDate;
//     const oldEnd = updatedItem?.requested?.endDate;

//     const newStart = updatedItem?.confirmed?.startDate;
//     const newEnd = updatedItem?.confirmed?.endDate;

//     // order.startDate = new Date(startDate);
//     // order.endDate = new Date(endDate);

//     // await order.save();

//     res.json({ success: true, order, message: `Zaktualizowano daty z ${oldStart?.toLocaleDateString()} - ${oldEnd?.toLocaleDateString()} na ${newStart.toLocaleDateString()} - ${newEnd.toLocaleDateString()}` });
//   } catch (err) {
//     console.error("Błąd aktualizacji dat:", err);
//     res.status(500).json({ error: "Błąd serwera" });
//   }
// };
