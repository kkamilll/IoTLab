import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, default: 0 },
  description: { type: String, default: "" },
  extraFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // pozwala przechowywać dowolne wartości
    default: {}
  },
  isDeleted: { type: Boolean, default: false }
});

export default mongoose.model('Product', productSchema);