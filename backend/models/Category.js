import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String, default: "" },
  description: { type: String, default: "" },
  descriptionEn: { type: String, default: "" },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  isVisible: { type: Boolean, default: false }
}, { timestamps: true });

const Category = mongoose.model("Category", categorySchema);
export default Category;
