import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  
  stockTotal: { type: Number, default: 0 }, // amount of product owned
  stockForRent: { type: Number, default: 0 }, // amount of product offered for rent
  stockReserved: { type: Number, default: 0 }, // amount of product wanted by users
  stockRentedOut: { type: Number, default: 0 }, // amount of product rented to users

  extraFields: { type: Map, of: String, default: {} }, // of: mongoose.Schema.Types.Mixed
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }], // <-- referencja do kategorii
  // tagRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  tags: [String],
  labRoom: { type: String },
  
  images: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    uniqueKey: { type: String },
    path: { type: String, required: true },
    isVisible: { type: Boolean, default: false },
    size: { type: Number }
  }],
  
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    uniqueKey: { type: String },
    path: { type: String, required: true },
    isVisible: { type: Boolean, default: false },
    size: { type: Number }
  }],
  
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  isSerialized: { type: Boolean, default: false },
  isRentable: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isShared: { type: Boolean, default: false }
}, { timestamps: true });

productSchema.set("optimisticConcurrency", true);
export default mongoose.model('Product', productSchema);