import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  stock: { type: Number, default: 0 },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }], // <-- referencja do kategorii
  tag: { type: String },
  extraFields: { type: Map, of: String, default: {} }, // of: mongoose.Schema.Types.Mixed
  image: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);