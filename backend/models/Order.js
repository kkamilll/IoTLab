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

const STATUS_ORDER = ["pending", "confirmed", "completed", "cancelled"];

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

const createOwnerStatus = (order, productOwnerMap) => {
  const ownerStatusMap = {}; // ownerId -> { finalStatus, hasChanged }

  for (const item of order.items) {
    const ownerId = productOwnerMap[item.product.toString()];
    if (!ownerId) throw new ConflictError("Order contains products with missing owners");

    const itemStatusIndex = STATUS_ORDER.indexOf(item.status);

    if (!ownerStatusMap[ownerId]) {
      ownerStatusMap[ownerId] = {
        finalStatus: item.status,
        hasChanged: false
      };
      continue;
    }

    const ownerData = ownerStatusMap[ownerId];

    // update finalStatus to smallest status


    // mark as changed if current item status differs from finalStatus
    if (item.status !== ownerData.finalStatus) {
      ownerData.hasChanged = true;
      if (itemStatusIndex < STATUS_ORDER.indexOf(ownerData.finalStatus)) {
        ownerData.finalStatus = item.status;
      }
    }
  }

  // build final ownerStatus array
  const ownerStatus = Object.entries(ownerStatusMap).map(([owner, data]) => {
    if (data.hasChanged) return { owner, status: 'changed' };
    return { owner, status: data.finalStatus };
  });

  return ownerStatus;
}

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  // processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // What the customer asked for
  requested: {
    quantity: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },

  // What the admin approved
  confirmed: {
    quantity: { type: Number, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null }
  },

  status: {
    type: String,
    enum: ["pending", "approved", "prepared", "rented", "returned", "rejected", "late"],
    default: "pending"
  },

  isReturned: { type: Boolean, default: false },

  timestamps: {
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    pickedUpAt: { type: Date },
    returnedAt: { type: Date }
  }
});

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    index: { type: String, required: true } // match: "/^\d{6}$/"
  },
  items: { type: [orderItemSchema], required: true }, // array of products with their rental dates

  status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending", required: true },
  ownerStatus: [{
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled", "changed"], default: "pending", required: true }
  }]
}, { timestamps: true });

// Możesz dodać middleware hashujący hasło przy zapisie (opcjonalnie)
orderSchema.pre('save', async function () {
  try {
    const order = this;
    const ownersArr = Object.values(await productOwnerMap(order));
    order.ownerStatus = ownersArr.map(owner => ({ owner, status: "pending" }));
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

orderSchema.index({ "ownerStatus.owner": 1 });

orderSchema.set("optimisticConcurrency", true);
const Order = mongoose.model("Order", orderSchema);
export default Order;