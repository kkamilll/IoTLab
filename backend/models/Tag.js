import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    name: { type: String, unique: true, trim: true, required: true },
});

export default mongoose.model("Tag", tagSchema);