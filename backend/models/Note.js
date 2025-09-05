import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
   important: { type: Boolean, default: false },
});

const Note = mongoose.model("Note", noteSchema);
export default Note;