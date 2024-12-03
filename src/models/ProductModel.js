const mongoose = require("mongoose");

// 1. Make a schema

// const someSchema = new mongoose.Schema(objectDefiningDataRules, SchemaOptions);
const ProductSchema = new mongoose.Schema({
    name: {type: String, required: true, minLength: 4, trim: true},
    sku: {type: Number, unique: true},
    description: {type: String},
    price: {type: Number, required: true},
    category: {type: String},
    artist: {type: String},
    stockQuantity: {type: Number, default: 0},
    images: [String],
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        weight: Number,
    },
});

// 2. Make a model based on the schema
const ProductModel = mongoose.model("Product", ProductSchema);

// 3. Export the model for the rest of our code to use
module.exports = {
    ProductModel
}
