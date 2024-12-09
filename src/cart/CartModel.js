// Importing mongoose to interact with MondoDB
const mongoose = require("mongoose");

// Define the cart schema
const CartSchema = new mongoose.Schema(
    {
        // User purchasing the product 
        userId: {
            type: mongoose.Schema.Types.ObjectId, // Reference to the User Model
            ref: "User", // String that mongoose will search for within it's internal registry. No need for import.
            required: true, // Field must be provided
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId, // Reference to the Product Model
                    ref: "Product", // String that mongoose will search for within it's internal registery. No need for import.
                    required: false, // Optional field to reflect that a cart can be empty.
                },
                quantity: {
                    type: Number,
                    required: true, // If there is a productID, there must be a quantity. 
                    min: 1, // Prevents negative quantities. 
                    default: 1,
                },
            },
        ],
    },
    {
        timestamps: true, // Automatically adds 'createdAt' and 'updatedAt' to entry
    }
);

// Create the cart model using the schema
const CartModel = mongoose.model("Cart", CartSchema);

// Exports the model so it can be used in other parts of the application
module.exports = {
    CartModel
};