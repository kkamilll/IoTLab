import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const addOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ error: "Invalid productId or quantity" });
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ error: "Not enough stock" });
    }

    product.stock -= quantity;
    await product.save();

    const totalPrice = product.price * quantity;

    const order = new Order({
      customer: userId,
      product: productId,
      quantity,
      totalPrice
    });

    await order.save();

    return res.status(201).json({
      success: true,
      message: "Order added successfully",
      order
    });
  } catch (error) {
    console.error("Error in addOrder:", error);
    return res.status(500).json({ success: false, message: "Server error while adding order" });
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    let query = {};

    if (req.user.role === "customer") {
      query = { customer: userId };
    }

    const orders = await Order.find(query)
      .populate("product", "name price")
      .populate("customer", "name email");

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error in getOrders:", error);
    return res.status(500).json({ success: false, message: "Server error in fetching orders" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    await Order.findByIdAndDelete(orderId);
    return res.status(200).json({ success: true, message: "Order deleted" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
