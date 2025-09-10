import Product from "../models/Product.js";
import Order from "../models/Order.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { AppError, ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ConflictError, ServerError } from '../errors/CustomErrors.js'
import { validateRequiredFields } from '../utils/validateRequiredFields.js'

export const productOwnerMap = async (order) => {
  const productIdSet = new Set();
  for (const item of order.items) {
    const productIdStr = item?.product?._id?.toString() || item?.product?.toString();
    if (!productIdStr || productIdStr === "undefined" || productIdStr === "null") throw new ValidationError("Product cannot be empty");
    if (!mongoose.Types.ObjectId.isValid(item.product)) {
      throw new ValidationError("Invalid product ID");
    }

    productIdSet.add(item.product);
  }
  if (!productIdSet.size) throw new ValidationError("Order cannot be empty");

  const productIdArray = [...productIdSet];
  const products = await Product.find({ _id: { $in: productIdArray }, isRentable: true, isDeleted: false }).select("_id owner");
  
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
    productOwnerMap[product._id.toString()] = ownerId;
  }

  return productOwnerMap;
}

const groupOrders = async (order) => {
  const productOwnerMap = await productOwnerMap(order);

  const groupedOrders = {};
  for (const item of order.items) {
    const owner = productOwnerMap[item.product];
    if (!owner) throw new ConflictError("Order contains products with missing owners");

    if (!groupedOrders[owner]) {
      groupedOrders[owner] = {
        customer: order.customer,
        items: []
      };
    }

    groupedOrders[owner].items.push(item);
  }

  const newGroupedOrders = Object.values(groupedOrders);

  // Validate each item against stock and date range
  for (const newGroupedOrder of newGroupedOrders) {
    for (const item of newGroupedOrder.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        // return res.status(404).json({ message: `Produkt ${item.product} nie istnieje` });
      }

      if (item.requested.quantity < 1) {
        // return res.status(400).json({ message: `Niepoprawna ilość dla ${product.name}` });
      }

      if (new Date(item.requested.startDate) > new Date(item.requested.endDate)) {
        // return res.status(400).json({ message: `Niepoprawne daty dla ${product.name}` });
      }
    }
  }

  // newGroupedOrders.forEach(async (newGroupedOrder) => {
  //   const order = new Order({
  //     customer: newGroupedOrder.customer,
  //     items: newGroupedOrder.items
  //   });
  //   await order.save();
  //   orders.push(order);
  // })

  return newGroupedOrders;
}

export const getOrderStatuses = (req, res, next) => {
  try {
    res.json({ success: true, statuses: Order.schema.path("ownerStatuses.status").enumValues });
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
        filter.ownerStatuses = { $elemMatch: { status } };
      }
    } else {
      const elem = { owner: new mongoose.Types.ObjectId(String(userId)) };
      if (status) elem.status = status;
      filter.ownerStatuses = { $elemMatch: elem };
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
        ownerStatuses: order.ownerStatuses.filter(
          ownerStatus => normalizeId(ownerStatus.owner) === userId
        )
      };
    });

    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({ success: true, orders: personalizedOrders, page, totalPages, totalOrders });
  } catch (error) {
    return next(new ServerError({ message: `Error fetching orders: ${error.message}` }));
  }
};


// export const getReturnedOrders = async (req, res, next) => {
//   try {
//     // Pobieramy tylko zamówienia, które mają flagę "returned: true"
//     const orders = await Order.find({ isReturned: true })
//       .populate("product", "name description stockTotal")
//       .populate("user", "name email");

//     // if (orders.length === 0) {
//     //   return next(new ResourceNotFoundError("Orders"));
//     // }

//     return res.status(200).json({ success: true, orders });
//   } catch (error) {
//     // console.error("Error fetching returned orders:", error);
//     return next(new ServerError({ message: `Error fetching returned orders: ${error.message}` }));
//   }
// };

// export const createOrder = async (req, res, next) => {
//   try {
//     if (!req.body) {
//         return next(new BadRequestError("Request body is missing"));
//     }

//     const userId = req.user._id;
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return next(new ValidationError("Invalid user ID"));
//     }

//     const { productId, quantity } = req.body;
//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       return next(new ValidationError("Invalid product ID"));
//     }

//     const newOrder = { user: userId, product: productId, quantity };
//     validateRequiredFields(Order, newOrder);

//     if (quantity < 1) return next(new ValidationError("Quantity must be at least 1"));

//     const updatedProduct  = await Product.findOneAndUpdate({ _id: productId, stockTotal: { $gte: quantity }, isDeleted: false }, { $inc: { stockTotal: -quantity }}, { new: true, runValidators: true });
//     if (!updatedProduct) {
//       const productExists = await Product.exists({ _id: productId, isDeleted: false });
//       if (!productExists) return next(new ResourceNotFoundError('Product'));
//       return next(new BadRequestError('quantity exceeds stock'));
//     }

//     const order = new Order({
//       user: userId,
//       product: productId,
//       quantity
//     });

//     await order.save();

//     return res.status(201).json({ success: true, message: "Order added successfully", order });
//   } catch (error) {
//     if (error instanceof MongoServerError && error.code === 11000) {
//       const [field, value] = Object.entries(error.keyValue)[0];
//       return next(new DuplicateKeyError({ field, value }));
//     }

//     if (error.name === 'ValidationError') {
//       return next(error);
//     }

//     return next(new ServerError({ message: error.message }));
//   }
// };

export const createOrder = async (req, res, next) => {
  try {
    if (!req.body) return next(new BadRequestError("Request body is missing"));

    const { customer, items } = req.body;

    // Fetch all products in one query
    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    products.forEach(p => productMap[p._id.toString()] = p);

    // Enrich items
    const enrichedItems = items.map(item => {
      const product = productMap[item.product];
      if (!product) throw new Error(`Produkt ${item.product} nie istnieje`);
      if (item.requested.quantity < 1) throw new Error(`Niepoprawna ilość dla ${product.name}`);
      if (new Date(item.requested.startDate) > new Date(item.requested.endDate))
        throw new Error(`Niepoprawne daty dla ${product.name}`);
      

      return {
        ...item,
        responsibleOwner: product.owner,
        status: "pending",
        isReturned: false
      };
    });

    const order = await Order.create({
      customer,
      items: enrichedItems,
      status: "pending",
    });

    res.status(201).json({ success: true, message: "Zamówienie utworzone", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const quickUpdateOrder = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true, });
  } catch (error) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
}

export const updateOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    let itemUpdates = req.body;
    const processableStatuses = ["pending", "approved", "prepared"];

    // normalize to array
    if (!Array.isArray(itemUpdates)) {
      itemUpdates = [itemUpdates];
    }

    const order = await Order.findById(orderId).session(session);
    if (!order) throw new ResourceNotFoundError("Order");

    const currentItemsMap = {};
    for (const item of order.items) {
      currentItemsMap[item._id.toString()] = item;
    }

    const productStockChanges = new Map();

    for (const update of itemUpdates) {
      const item = currentItemsMap[update.itemId];
      if (!item) {
        console.warn(`Skipping update for non-existing item ${update.itemId}`);
        continue;
      }

      const prevStatus = item.status;
      if (prevStatus === update.newStatus) continue; // nothing to do

      // validate assigned if provided
      if (update.assigned && processableStatuses.includes(update.newStatus)) {
        if (update.assigned.quantity <= 0) {
          throw new ValidationError(`Quantity must be > 0`);
        }
        if (
          new Date(update.assigned.startDate) > new Date(update.assigned.endDate)
        ) {
          throw new ValidationError(`Invalid date range`);
        }
        item.assigned = update.assigned;
      }

      item.status = update.newStatus;

      const deltaKey = item.product.toString();
      const delta = productStockChanges.get(deltaKey) || 0;

      if (update.newStatus === "rented") {
        productStockChanges.set(
          deltaKey,
          delta + (item.assigned?.quantity || 0)
        );
      }
      if (prevStatus === "rented") {
        productStockChanges.set(
          deltaKey,
          delta - (item.assigned?.quantity || 0)
        );
      }
    }

    // batch load products
    const productIds = [...productStockChanges.keys()];
    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } }).session(session);

      for (const product of products) {
        const delta = productStockChanges.get(product._id.toString());
        if (!delta) continue;

        product.stockRentedOut += delta;

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

    res.json({ success: true, order });
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
