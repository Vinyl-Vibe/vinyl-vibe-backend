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
      ref: 'User', // Reference to the User model
      required: true, // This field is mandatory
    },

    // Array of products included in the order
    products: [
      {
        // Reference to the product in the order
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product', // Reference to the Product model
          required: true,
        },
        
        // Price per unit of the product at the time of the order
        unitPrice: {
          type: Number,
          required: true,
          min: 0, // Ensure the price is non-negative
        },

        // Quantity of the product ordered
        quantity: {
          type: Number,
          required: true,
          min: 1, // Ensure at least one unit is ordered
        },

        // Snapshot of the product name at the time of the order
        productName: {
          type: String,
          required: true,
        },
      },
    ],

    // Total cost of the order, should be calculated and validated
    total: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function () {
          const calculatedTotal = this.products.reduce(
            (sum, product) => sum + product.unitPrice * product.quantity,
            0
          );
          return this.total === calculatedTotal;
        },
        message: 'Total must equal the sum of unit prices multiplied by quantities.'
      },
    },

    // Status of the order
    status: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'canceled', 'returned'], // Restrict status to specific values
      default: 'pending', // Default value if not provided
    },

    // Shipping address for order delivery
    shippingAddress: {
      street: { type: String, required: true },
      suburb: { type: String, required: true },
      postcode: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
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
  }
);

// Create the Order model
const OrderModel = mongoose.model("Order", OrderSchema);

// Export the model for use in other parts of the application
module.exports = {
  OrderModel
  };