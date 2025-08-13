import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, default: 0 },
  description: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false },
  extraFields: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
});

export default mongoose.model('Product', productSchema);