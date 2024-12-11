// Importing mongoose to interact with MondoDB
const mongoose = require("mongoose");

// Define the cart schema
const CartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        products: [
            {
                _id: false,
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Create the cart model using the schema
const CartModel = mongoose.model("Cart", CartSchema);

// Exports the model so it can be used in other parts of the application
module.exports = {
    CartModel
};