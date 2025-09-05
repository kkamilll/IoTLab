import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    link: { type: String, default: null },
    order: { type: Number, default: 0 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Material', materialSchema);
