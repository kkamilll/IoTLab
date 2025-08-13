import Product from "../models/Product.js";
import Order from "../models/Order.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'


export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ValidationError("Invalid user ID"));
    }

    const { productId, quantity } = req.body;
    if (!productId) return next(new BadRequestError("required Product ID"))
    if (quantity == null) return next(new BadRequestError("required Quantity"))
    if (quantity < 1) return next(new BadRequestError("Quantity must be at least 1"));

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new ValidationError("Invalid product ID"));
    }

    const updatedProduct  = await Product.findOneAndUpdate({ _id: productId, stock: { $gte: quantity }, isDeleted: false }, { $inc: { stock: -quantity }}, { new: true, runValidators: true });
    if (!updatedProduct) {
      const productExists = await Product.exists({ _id: productId, isDeleted: false });
      if (!productExists) return next(new ResourceNotFoundError('Product'));
      return next(new BadRequestError('quantity exceeds stock'));
    }

    const order = new Order({
      userRef: userId,
      productRef: productId,
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

export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ValidationError("Invalid user ID"));
    }
    
    let mongoQuery = {};

    // since when there is customer role?
    if (req.user.role === "customer") {
      mongoQuery = { customer: userId };
    }

    const orders = await Order.find(mongoQuery)
      .populate("userRef", "name email")
      .populate("productRef", "name price");

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};

export const deleteOrder = async (req, res, next) => {
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

    const updatedProduct = await Product.findOneAndUpdate({ _id: order.productRef, isDeleted: false}, { $inc: { stock: order.quantity }}, { new: true, runValidators: true });
    if (!updatedProduct) {
      console.warn(`Product ${order.productRef} does not exist. Order ${orderId} will still be deleted.`);
    }

    await order.deleteOne();

    return res.status(200).json({ success: true, message: "Order deleted and stock updated" });
  } catch (error) {
    return next(new ServerError({ message: error.message }));
  }
};
