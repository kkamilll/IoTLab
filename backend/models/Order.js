import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
//   quantity: { type: Number, required: true, min: 1 },
//   orderDate: { type: Date, default: Date.now },
//   isReturned: { type: Boolean, default: false } // flaga zwrotu
// });

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

  // What the customer asked for
  requested: {
    quantity: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },

  // What the admin approved
  confirmed: {
    quantity: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date }
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
    index: { type: String, required: true }
  },
  items: [orderItemSchema], // array of products with their rental dates
  status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;