import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  important: { type: Boolean, default: false },
}, { timestamps: true });

const Note = mongoose.model("Note", noteSchema);
export default Note;
