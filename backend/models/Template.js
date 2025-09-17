import mongoose from "mongoose";

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Template', templateSchema);