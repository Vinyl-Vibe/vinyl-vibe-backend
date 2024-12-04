const mongoose = require("mongoose");

// 1. Make a schema

// const someSchema = new mongoose.Schema(objectDefiningDataRules, SchemaOptions);
const ProductSchema = new mongoose.Schema({
    name: {type: String, required: true, minLength: 4, trim: true},
    sku: {type: Number}
    // price: {type: Number, required: true},
    // description: {type: String},
});

// 2. Make a model based on the schema
const ProductModel = mongoose.model("Product", ProductSchema);

// 3. Export the model for the rest of our code to use
module.exports = {
    ProductModel
}
