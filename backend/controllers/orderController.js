import Product from "../models/Product.js";
import Order from "../models/Order.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'
import { validateRequiredFields } from '../utils/validateRequiredFields.js'

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ isReturned: false }).populate("product");
    // if (orders.length === 0) {
    //   return next(new ResourceNotFoundError("Orders"));
    // }

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return next(new ServerError({ message: `Error fetching orders: ${error.message}` }));
  }
};

export const getReturnedOrders = async (req, res, next) => {
  try {
    // Pobieramy tylko zamówienia, które mają flagę "returned: true"
    const orders = await Order.find({ isReturned: true })
      .populate("product", "name description stock")
      .populate("user", "name email");

    // if (orders.length === 0) {
    //   return next(new ResourceNotFoundError("Orders"));
    // }

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    // console.error("Error fetching returned orders:", error);
    return next(new ServerError({ message: `Error fetching returned orders: ${error.message }`}));
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ValidationError("Invalid user ID"));
    }

    const { productId, quantity } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    const newOrder = { user: userId, product: productId, quantity };
    validateRequiredFields(Order, newOrder);

    if (quantity < 1) return next(new ValidationError("Quantity must be at least 1"));

    const updatedProduct  = await Product.findOneAndUpdate({ _id: productId, stock: { $gte: quantity }, isDeleted: false }, { $inc: { stock: -quantity }}, { new: true, runValidators: true });
    if (!updatedProduct) {
      const productExists = await Product.exists({ _id: productId, isDeleted: false });
      if (!productExists) return next(new ResourceNotFoundError('Product'));
      return next(new BadRequestError('quantity exceeds stock'));
    }

    const order = new Order({
      user: userId,
      product: productId,
      quantity
    });

    await order.save();

    return res.status(201).json({ success: true, message: "Order added successfully", order });
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
    const updatedProduct = await Product.findByIdAndUpdate(order.product, {$inc: { stock: order.quantity }}, { runValidators: true });
    if (!updatedProduct) {
      console.warn(`Product ${order.product} does not exist. Order ${orderId} will still be returned.`);
    }

    res.json({ success: true, message: "Zamówienie zwrócone", order });
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

    const updatedProduct = await Product.findOneAndUpdate({ _id: order.product, isDeleted: false}, { $inc: { stock: order.quantity }}, { new: true, runValidators: true });
    if (!updatedProduct) {
      console.warn(`Product ${order.product} does not exist. Order ${orderId} will still be deleted.`);
    }

    await order.deleteOne();

    return res.status(200).json({ success: true, message: "Order deleted and stock updated" });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};