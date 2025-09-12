import mongoose from "mongoose";
import { productOwnerMap } from "../controllers/orderController.js";

import { AppError, ValidationError, ConflictError, ServerError } from '../errors/CustomErrors.js'

const OWNER_STATUS_ORDER = ["pending", "approved", "prepared", "rented", "returned", "rejected"];
const FINALIZED_STATUS_ORDER = ["returned", "rejected"];

const createOwnersData = (order, ownersMapOld, ownersMap, _newAssignedStartDate, _newAssignedEndDate) => {
  const ownerDataMap = {}; // ownerId -> { finalStatus, hasChanged }

  for (const item of order.items) {
    const productId = item.product._id ? item.product._id.toString() : item.product.toString();

    const ownerId = ownersMap[productId];
    const prevOwnerId = ownersMapOld[productId];

    const prevOwnerData = order.ownersData?.find(ownerData => ownerData.owner.toString() === prevOwnerId);
    const currOwnerData = order.ownersData?.find(ownerData => ownerData.owner.toString() === ownerId);


    if (!ownerId) {
      console.warn(`Skipping item ${item._id} because its product ${productId} has no owner`);
      continue;
    }
    // if (!ownerId) throw new ConflictError("Order contains products with missing owners");

    const itemStatusIndex = OWNER_STATUS_ORDER.indexOf(item.status);

    if (!ownerDataMap[ownerId]) {
      ownerDataMap[ownerId] = {
        assignedStartDate: _newAssignedStartDate || prevOwnerData?.assignedStartDate || order.requestedStartDate,
        assignedEndDate: _newAssignedEndDate || prevOwnerData?.assignedEndDate || order.requestedEndDate,

        finalStatus: item.status,
        prevStatus: currOwnerData?.status || "pending",
        
        // hasChanged: false
        hasAssignedDates: !!((_newAssignedStartDate && _newAssignedEndDate) || (prevOwnerData?.assignedStartDate && prevOwnerData?.assignedEndDate)),
      };
      continue;
    }

    const ownerData = ownerDataMap[ownerId];

    // update finalStatus to smallest status
    // mark as changed if current item status differs from finalStatus
    if (item.status !== ownerData.finalStatus) {
      // ownerData.hasChanged = true;
      if (itemStatusIndex < OWNER_STATUS_ORDER.indexOf(ownerData.finalStatus)) {
        ownerData.finalStatus = item.status;
      }
    }
  }

  // build final ownerStatus array
  const ownerData = Object.entries(ownerDataMap).map(([owner, data]) => {
    const isStatusDecreased = OWNER_STATUS_ORDER.indexOf(data.finalStatus) < OWNER_STATUS_ORDER.indexOf(data.prevStatus);
    const isPrevOrderFinalized = FINALIZED_STATUS_ORDER.includes(data.prevStatus);

    if (isStatusDecreased && !isPrevOrderFinalized) 
      return { owner, assignedStartDate: data.assignedStartDate, assignedEndDate: data.assignedEndDate, status: 'changed' };

    if (data.finalStatus == 'pending' || (FINALIZED_STATUS_ORDER.includes(data.finalStatus) && !data.hasAssignedDates))
      return { owner, status: data.finalStatus };

    return { owner, assignedStartDate: data.assignedStartDate, assignedEndDate: data.assignedEndDate, status: data.finalStatus };
  });

  return ownerData;
}

const ORDER_ITEM_STATUS = ["pending", "approved", "prepared", "rented", "late", "returned", "rejected"];
const OWNERS_DATA_STATUS = ["changed", "pending", "approved", "prepared", "rented", "returned", "rejected"];
const STATUS_HISTORY_ACTIONS = ["approved", "prepared", "rented", "returned", "cancelled", "rejected", "ownershipChanged"];
const STATUS_HISTORY_ROLES = ["owner", "admin", "system"];

const orderCustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  index: { type: String, required: true },
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

    const ownersData = createOwnersData(order, ownersMapOld, ownersMap, order._newAssignedStartDate, order._newAssignedEndDate);
    order.ownersData = ownersData;

  } catch (error) {
    // Handle validation error
    if (error instanceof AppError) throw error;
    throw new ServerError({ message: error.message });
  }
});

// orderSchema.pre('updateOne', async function () {
//   try {
//     const filter = this.getQuery();
//     const prevOrder = await Order.findOne(filter); // current DB state
//     if (!prevOrder) throw new ConflictError("Order not found");

//     const update = this.getUpdate();
//     if (update.$set) deepMerge(prevOrder, update.$set);

//     const ownersMap = await productOwnerMap(prevOrder);
//     this.set('ownerStatus', createOwnerStatus(prevOrder, ownersMap));
//   } catch (error) {
//     if (error instanceof AppError) throw error;
//     throw new ServerError({ message: error.message });
//   }
// });

// orderSchema.pre('updateOne', ...)
// orderSchema.pre('findOneAndUpdate', ...)
// orderSchema.pre('updateMany', ...)

orderSchema.index({ "ownersData.owner": 1 });

orderSchema.set("optimisticConcurrency", true);
const Order = mongoose.model("Order", orderSchema);
export default Order;