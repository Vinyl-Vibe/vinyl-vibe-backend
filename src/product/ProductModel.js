// Importing mongoose to interact with MongoDB
const mongoose = require("mongoose");

// Define the product schema
const ProductSchema = new mongoose.Schema(
    {
        // Name of the product (required, must be at least 4 characters)
        name: {
            type: String,
            required: true,          // Field must be provided
            minLength: 4,            // Minimum length of 4 characters
            trim: true,              // Automatically trim spaces from the beginning and end
        },
        
        // SKU (Stock Keeping Unit) for unique product identification
        sku: {
            type: Number,
            unique: true,            // Ensures the SKU is unique for each product
        },
        
        // General description of the product (optional field)
        description: {
            type: String,
        },
        
        // Price of the product (required and cannot be negative number)
        price: {
            type: Number,
            required: true,          // Field must be provided
            min: 0,                  // Price cannot be less than 0
        },
        
        // Type of product (must be one of the specified types)
        type: {
            type: String,
            enum: ["vinyl", "turntable", "accessory", "speaker"], // Only these types are allowed
            required: true,          // Field must be provided
        },
        
        // Information specific to vinyl products (only relevant for 'vinyl' type)
        albumInfo: {
            artist: {
                type: String,         // Artist name for the album
            },
            genre: {
                type: String,         // Genre of the album (e.g., Rock, Jazz)
            },
            trackList: {
                type: [String],       // List of track names (array of strings)
            },
            releaseDate: {
                type: Date,           // Release date of the album
            },
        },
        
        // Stock quantity of the product (cannot be negative number)
        stock: {
            type: Number,
            required: true,          // Field must be provided
            min: 0,                  // Stock cannot be negative
        },
        
        // Array of URLs for product images (optional field)
        images: {
            type: [String],          // Array of strings (URLs of product images)
        },
        
        // URL for a thumbnail image of the product (optional field)
        thumbnail: {
            type: String,            // URL of the thumbnail image
        },
        
        // Timestamp for when the product was created
        createdAt: {
            type: Date,
            default: Date.now,       // Automatically set to the current date/time when the product is created
        },
    },
    {
        timestamps: true,             // Automatically add `createdAt` and `updatedAt` fields to track changes
    }
);

// Create the product model using the schema
const ProductModel = mongoose.model("Product", ProductSchema);

// Export the model so it can be used in other parts of the application
module.exports = {
    ProductModel
};
