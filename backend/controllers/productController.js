import Product from '../models/Product.js';
import mongoose from 'mongoose';

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export const createProduct = async (req, res) => {
  const product = req.body;

  if (!product.name || !product.price) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  try {
    const newProduct = new Product(product);
    await newProduct.save();

    res.status(201).json({
      success: true,
      data: newProduct
    });
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}
    
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ message: 'Invalid product ID' });
  };

  try{
    const updatedProduct = await Product.findByIdAndUpdate(id, product,{new:true});
    res.status(200).json({success: true, data: updatedProduct });
  } catch (error) {
    res.status(500).json({
      success: false, 
      message: 'Server error'
    });
  }
}

export const deleteProduct = async (req, res) => {
  const { id } = req.params;  

  if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ message: 'Invalid product ID' });
  };

  try {
    const product = await Product.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}