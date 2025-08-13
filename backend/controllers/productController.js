import mongoose from "mongoose";
import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false });
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createProduct = async (req, res) => {
  const { name, price, stock, description, extraFields } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ success: false, message: "Name and price are required" });
  }
  try {
    const newProduct = new Product({
      name,
      price,
      stock: stock || 0,
      description,
      extraFields: extraFields || {}
    });
    await newProduct.save();
    return res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }
  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.isDeleted = true; // ustawienie flagi zamiast fizycznego usuwania
    await product.deleteOne();

    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
