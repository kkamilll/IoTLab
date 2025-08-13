import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
