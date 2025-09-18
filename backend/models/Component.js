import mongoose from "mongoose";

const linkSchema = new mongoose.Schema({
  text: { type: String, required: true },
  href: { type: String, required: true }
}, { timestamps: true });

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },   // nazwa pliku oryginalna
  path: { type: String, required: true },   // ścieżka na serwerze
  mimeType: { type: String, required: true } // typ pliku (pdf, image/png itd.)
}, { timestamps: true });

const componentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String, default: "" },
  links: { type: [linkSchema], default: [] },
  files: { type: [fileSchema], default: [] },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const Component = mongoose.model("Component", componentSchema);
export default Component;