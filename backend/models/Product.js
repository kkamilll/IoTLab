import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
    },

    price: {
        type: Number,
    },

    stock: {
        type: Number,
    },

    isDeleted: {
        type: Boolean,
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },

    
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
    }
});

const Product = mongoose.model("Product", productSchema);

export default Product;
