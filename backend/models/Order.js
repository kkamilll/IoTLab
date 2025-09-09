import mongoose from "mongoose";
import { productOwnerMap } from "../controllers/orderController.js";

import { AppError, ValidationError, ConflictError, ServerError } from '../errors/CustomErrors.js'

// const orderSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
//   quantity: { type: Number, required: true, min: 1 },
//   orderDate: { type: Date, default: Date.now },
//   isReturned: { type: Boolean, default: false } // flaga zwrotu
// });


// const deepMerge = (target, source) => {
//   for (const key in source) {
//     if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
//       target[key] = deepMerge(target[key] || {}, source[key]);
//     } else if (Array.isArray(source[key])) {
//       // For arrays, replace the array entirely (safe for items)
//       target[key] = source[key];
//     } else {
//       target[key] = source[key];
//     }
//   }
//   return target;
// };
const OWNER_STATUS_ORDER = ["pending", "approved", "prepared", "rented", "returned", "rejected"];

const createOwnerStatuses = (order, productOwnerMap) => {
  const ownerStatusesMap = {}; // ownerId -> { finalStatus, hasChanged }

  for (const item of order.items) {
    const productId = item.product._id ? item.product._id.toString() : item.product.toString();
    const ownerId = productOwnerMap[productId];

    if (!ownerId) {
      console.warn(`Skipping item ${item._id} because its product ${productId} has no owner`);
      continue;
    }
    // if (!ownerId) throw new ConflictError("Order contains products with missing owners");

    const itemStatusIndex = OWNER_STATUS_ORDER.indexOf(item.status);

    if (!ownerStatusesMap[ownerId]) {
      ownerStatusesMap[ownerId] = {
        finalStatus: item.status,
        prevStatus: order.ownerStatuses.find(ownerStatus => ownerStatus.owner === ownerId)?.status || "pending",
        // hasChanged: false
      };
      continue;
    }

    const ownerData = ownerStatusesMap[ownerId];

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
  const ownerStatuses = Object.entries(ownerStatusesMap).map(([owner, data]) => {
    if (OWNER_STATUS_ORDER.indexOf(data.finalStatus) < OWNER_STATUS_ORDER.indexOf(data.prevStatus)) return { owner, status: 'changed' };
    return { owner, status: data.finalStatus };
  });

  return ownerStatuses;
}

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

  requested: {
    quantity: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },

  assigned: {
    quantity: { type: Number, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null }
  },

  status: {
    type: String,
    enum: ["pending", "approved", "prepared", "rented", "late", "returned", "rejected"],
    default: "pending"
  },

  responsibleOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // isReturned: { type: Boolean, default: false }
});

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    index: { type: String, required: true }
  },

  items: { type: [orderItemSchema], required: true },

  // status: {
  //   type: String,
  //   enum: ["pending", "confirmed", "inProgress", "completed", "cancelled", "rejected"],
  //   default: "pending"
  // },

  ownerStatuses: [{
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["changed", "pending", "approved", "prepared", "rented", "returned", "rejected"],
      default: "pending"
    }
  }],

  statusHistory: [{
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    action: {
      type: String,
      enum: ["approved", "prepared", "rented", "returned", "cancelled", "rejected", "ownershipChanged"],
      required: true
    },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["owner", "admin", "system"], required: true },
    at: { type: Date, default: Date.now },
    oldOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    newOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }]
}, { timestamps: true });

orderSchema.pre('save', async function () {
  try {
    const order = this;
    const ownersMap = await productOwnerMap(order);

    order.ownerStatuses = createOwnerStatuses(order, ownersMap);
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

orderSchema.index({ "ownerStatuses.owner": 1 });

orderSchema.set("optimisticConcurrency", true);
const Order = mongoose.model("Order", orderSchema);
export default Order;