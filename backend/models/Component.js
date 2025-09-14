import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },   // nazwa pliku oryginalna
  path: { type: String, required: true },   // ścieżka na serwerze
  mimeType: { type: String, required: true } // typ pliku (pdf, image/png itd.)
}, { timestamps: true });

const componentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  files: [fileSchema],
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const Component = mongoose.model("Component", componentSchema);
export default Component;
