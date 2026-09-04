import mongoose from "mongoose";
import { productOwnerMap, createOwnersData } from "../services/orderService.js";

import { AppError, ValidationError, ConflictError, ServerError } from '../errors/CustomErrors.js'

const ORDER_ITEM_STATUS = ["pending", "approved", "prepared", "rented", "late", "returned", "rejected"];
const OWNERS_DATA_STATUS = ["changed", "pending", "approved", "prepared", "rented", "returned", "rejected"];
const STATUS_HISTORY_ACTIONS = ["approved", "prepared", "rented", "returned", "cancelled", "rejected", "ownershipChanged"];
const STATUS_HISTORY_ROLES = ["owner", "admin", "system"];

const orderCustomerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  index: { type: String, required: true },
  semester: { type: Number, required: true },
  yearOfStudy: { type: Number, required: true },
  fieldOfStudy: { type: String, required: true },
  specialization: { type: String },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  purpose: { type: String },
  notes: { type: String }, 
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  responsibleOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  requestedQuantity: { type: Number, required: true },
  assignedQuantity: { type: Number },

  status: { type: String, enum: ORDER_ITEM_STATUS, default: "pending" },
});

const ownerDataSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: OWNERS_DATA_STATUS, default: "pending" },

  customerApproval: { type: Boolean },

  assignedStartDate: { type: Date },
  assignedEndDate: { type: Date },
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  action: { type: String, enum: STATUS_HISTORY_ACTIONS, required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: STATUS_HISTORY_ROLES, required: true },
  at: { type: Date, default: Date.now },
  oldOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  newOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true, default: () => require("crypto").randomUUID() },
  customerKey: { type: String, required: true },

  customer: { type: orderCustomerSchema, required: true },
  items: { type: [orderItemSchema], required: true, validate: [arr => arr.length > 0, "Order must have at least one item"] },

  requestedStartDate: { type: Date, required: true },
  requestedEndDate: { type: Date, required: true },

  ownersData: { type: [ownerDataSchema], default: [] },
  statusHistory: { type: [statusHistorySchema], default: [] },
}, { timestamps: true });

orderSchema.pre('save', async function () {
  try {
    const order = this;
    const ownersMapOld = await productOwnerMap(order);

    const ownersMap = { ...ownersMapOld }
    for (const updatedProduct of order._updatedProducts || []) {
      const productId = updatedProduct._id?.toString();
      const productOwner = updatedProduct.owner?._id ? updatedProduct.owner._id.toString() : updatedProduct.owner?.toString();

      ownersMap[productId] = productOwner;
    }

    order.ownersData = createOwnersData(order, ownersMapOld, ownersMap, order._newAssignedStartDate, order._newAssignedEndDate);

    const isNewOrder = order.isNew;
    const isUpdate = !order.isNew && order._isUpdate;

  } catch (error) {
    // Handle validation error
    console.error("Error in pre save:", error);
    if (error instanceof AppError) throw error;
    throw new ServerError({ message: error.message });
  }
});

orderSchema.index({ "ownersData.owner": 1 });

orderSchema.set("optimisticConcurrency", true);
const Order = mongoose.model("Order", orderSchema);
export default Order;