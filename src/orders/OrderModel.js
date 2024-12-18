// Import Mongoose for defining the schema
const mongoose = require("mongoose");

// Create the order schema
const OrderSchema = new mongoose.Schema(
    {
        // Unique identifier for the order, automatically generated by MongoDB
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true,
        },

        // Reference to the user who placed the order
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
            required: true, // This field is mandatory
        },

        // Array of products included in the order
        products: [
            {
                // Reference to the product in the order
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product", // Reference to the Product model
                    required: true,
                },

                // Quantity of the product ordered
                quantity: {
                    type: Number,
                    required: true,
                    min: 1, // Ensure at least one unit is ordered
                },

                // Price per unit of the product at the time of the order
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],

        // Total cost of the order, should be calculated and validated
        total: {
            type: Number,
            required: true,
        },

        // Status of the order
        status: {
            type: String,
            enum: [
                "pending",
                "completed",
                "canceled",
                "shipped",
                "delivered",
                "returned",
                "payment received",
            ], // Restrict status to specific values
            default: "pending", // Default value if not provided
        },

        // Shipping address for order delivery
        shippingAddress: {
            street: String,
            suburb: String,
            postcode: String,
            state: String,
            country: String,
            _id: false, // Prevent subdoc _id
        },

        // Timestamp for when the order was created
        createdAt: {
            type: Date,
            default: Date.now, // Automatically set to current timestamp
        },
    },
    {
        // Automatically add `createdAt` and `updatedAt` fields
        timestamps: true,
        // Disables the __v field
        versionKey: false,
    }
);

// Create the Order model
const OrderModel = mongoose.model("Order", OrderSchema);

// Export the model for use in other parts of the application
module.exports = {
    OrderModel,
};
