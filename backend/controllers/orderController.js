import Product from "../models/Product.js";
import Order from "../models/Order.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { AppError, ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ConflictError, ServerError } from '../errors/CustomErrors.js'
import { validateRequiredFields } from '../utils/validateRequiredFields.js'

export const productOwnerMap = async (order) => {
  const productIdSet = new Set();
  for (const item of order.items) {
    const productIdStr = item?.product?.toString();
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
    if (!product?.owner?.toString()?.trim()) throw new ConflictError("Order contains products with missing owners");
    if (!mongoose.Types.ObjectId.isValid(product.owner)) {
      throw new ValidationError("Invalid owner ID");
    }

    const ownerId = typeof product.owner === "object" ? product.owner._id.toString() : product.owner.toString();
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
    res.json({ success: true, statuses: Order.schema.path("status").enumValues });
  } catch {
    return next(new ServerError({ message: `Error fetching orders: ${error.message}` }));
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const role = req.user.role;
    const user = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return next(new ValidationError("Invalid user ID"));
    }
    let filter = {};
    if (role !== "admin") {
      filter = { "ownerStatus.owner": user };
    }

    const orders = await Order.find(filter) // fetch all, frontend will filter returned
      .populate({
        path: 'items.product',
        select: 'name stockTotal stockForRent stockRentedOut'
      });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return next(new ServerError({ message: `Error fetching orders: ${error.message}` }));
  }
};


export const getReturnedOrders = async (req, res, next) => {
  try {
    // Pobieramy tylko zamówienia, które mają flagę "returned: true"
    const orders = await Order.find({ isReturned: true })
      .populate("product", "name description stockTotal")
      .populate("user", "name email");

    // if (orders.length === 0) {
    //   return next(new ResourceNotFoundError("Orders"));
    // }

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    // console.error("Error fetching returned orders:", error);
    return next(new ServerError({ message: `Error fetching returned orders: ${error.message}` }));
  }
};

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
    // Ensure request body exists
    if (!req.body) {
      return next(new BadRequestError("Request body is missing"));
    }

    const { customer, items } = req.body;
    const newOrder = { customer, items };
    validateRequiredFields(Order, newOrder);
    // if (!customer?.email || !items?.length) {
    //   return res.status(400).json({ message: "Dane zamówienia są niekompletne" });
    // }

    // Validate each item against stock and date range
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Produkt ${item.product} nie istnieje` });
      }

      if (item.requested.quantity < 1) {
        return res.status(400).json({ message: `Niepoprawna ilość dla ${product.name}` });
      }

      if (new Date(item.requested.startDate) > new Date(item.requested.endDate)) {
        return res.status(400).json({ message: `Niepoprawne daty dla ${product.name}` });
      }
    }

    const order = new Order({
      customer: newOrder.customer,
      items: newOrder.items,
    });

    await order.save();
    // console.log("order: ", order, "orders: ", await groupOrders(order, next));

    res.status(201).json({ message: "Zamówienie utworzone", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

// TODO: add transaction
export const returnOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new BadRequestError("Invalid order ID"));
    }

    const order = await Order.findOneAndUpdate({ _id: orderId, isReturned: false }, { isReturned: true }, { new: true });
    // if (!order) return res.status(404).json({ success: false, error: "Zamówienie nie istnieje" });
    if (!order) return next(new BadRequestError("Order not found or already returned"));

    // przywracamy stock produktu
    const updatedProduct = await Product.findByIdAndUpdate(order.product, { $inc: { stockTotal: order.quantity } }, { runValidators: true });
    if (!updatedProduct) {
      console.warn(`Product ${order.product} does not exist. Order ${orderId} will still be returned.`);
    }

    res.status(200).json({ success: true, message: "Zamówienie zwrócone", order });
  } catch (error) {
    return next(new ServerError({ message: `Error returning orders: ${error.message}` }));
  }
};

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

export const updateOrderQuantity = async (req, res) => {
  try {
    const { orderId, itemId, quantity } = req.body;
    if (!orderId || !itemId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Brak danych lub nieprawidłowa ilość" });
    }

    const order = await Order.findByIdAndUpdate(orderId, {
      $set: {
        "items.$[elem].confirmed.quantity": quantity
      }
    },
      {
        new: true, // return updated doc
        arrayFilters: [{ "elem.product": itemId }] // match correct item in array
      });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const updatedItem = order.items.find(
      (item) => item.product.toString() === itemId.toString()
    );
    // const item = order.items.find(i => i.product?._id.toString() === itemId.toString());
    // if (!item) return res.status(404).json({ error: "Produkt nie znaleziony w zamówieniu" });

    // const oldQuantity = order.quantity;
    // item.quantity = quantity;

    // order.history.push({
    //   action: "quantity_update",
    //   quantity,
    //   productName: item.product?.name || item.productName,
    //   timestamp: new Date(),
    // });

    // await order.save();

    res.json({ success: true, order, message: `Zmieniono ilość z ${updatedItem?.requested?.quantity} na ${updatedItem?.confirmed?.quantity}` });
  } catch (err) {
    console.error("Błąd aktualizacji ilości:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateOrderDates = async (req, res) => {
  try {
    const { orderId, itemId, startDate, endDate } = req.body;

    if (!orderId || !startDate || !endDate) {
      return res.status(400).json({ error: "Brak danych do aktualizacji" });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: "Data rozpoczęcia nie może być późniejsza niż data zakończenia" });
    }

    // const order = await Order.findById(orderId);
    const order = await Order.findByIdAndUpdate(orderId, {
      $set: {
        "items.$[elem].confirmed.startDate": startDate,
        "items.$[elem].confirmed.endDate": endDate,
      }
    },
      {
        new: true, // return updated doc
        arrayFilters: [{ "elem.product": itemId }] // match correct item in array
      });
    if (!order) return res.status(404).json({ error: "Zamówienie nie znalezione" });
    const updatedItem = order.items.find(
      (item) => item.product.toString() === itemId.toString()
    );

    const oldStart = updatedItem?.requested?.startDate;
    const oldEnd = updatedItem?.requested?.endDate;

    const newStart = updatedItem?.confirmed?.startDate;
    const newEnd = updatedItem?.confirmed?.endDate;

    // order.startDate = new Date(startDate);
    // order.endDate = new Date(endDate);

    // await order.save();

    res.json({ success: true, order, message: `Zaktualizowano daty z ${oldStart?.toLocaleDateString()} - ${oldEnd?.toLocaleDateString()} na ${newStart.toLocaleDateString()} - ${newEnd.toLocaleDateString()}` });
  } catch (err) {
    console.error("Błąd aktualizacji dat:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
