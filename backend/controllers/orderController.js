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

    const order = new Order({
      customer: userId,
      product: productId,
      quantity
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
    const orders = await Order.find({ isReturned: false }).populate("product");
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Błąd pobierania zamówień" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const product = await Product.findById(order.product);
    if (product) {
      product.stock += order.quantity; // Przywróć stock
      await product.save();
    }

    await Order.findByIdAndDelete(orderId);

    return res.status(200).json({ success: true, message: "Order deleted and stock updated" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getReturnedOrders = async (req, res) => {
  try {
    // Pobieramy tylko zamówienia, które mają flagę "returned: true"
const orders = await Order.find({ isReturned: true })
  .populate("product", "name description stock")
  .populate("customer", "name email");

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching returned orders:", error);
    return res.status(500).json({ success: false, message: "Błąd serwera przy pobieraniu zwrotów" });
  }
};
export const returnOrder = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ success: false, error: "Brak ID zamówienia" });

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, error: "Zamówienie nie istnieje" });

    if (order.isReturned) {
      return res.status(400).json({ success: false, message: "Zamówienie już zostało zwrócone" });
    }

    // przywracamy stock produktu
    const product = await Product.findById(order.product);
    if (product) {
      product.stock += order.quantity;
      await product.save();
    }

    order.isReturned = true; // oznaczamy zwrot
    await order.save();

    res.json({ success: true, message: "Zamówienie zwrócone", order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

