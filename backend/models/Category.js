import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
}, { timestamps: true });

const Category = mongoose.model("Category", categorySchema);
export default Category;
