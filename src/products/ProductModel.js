// Importing mongoose to interact with MongoDB
const mongoose = require("mongoose");

// Define the product schema
const ProductSchema = new mongoose.Schema(
    {
        // Name of the product (required, no minimum length)
        name: {
            type: String,
            required: true, // Field must be provided
            trim: true, // Automatically trim spaces from beginning and end
        },

        // General description of the product (optional field)
        description: {
            type: String,
            required: false, // Optional field
        },

        // Price of the product (required and cannot be negative number)
        price: {
            type: Number,
            required: true, // Field must be provided
            min: 0, // Price cannot be less than 0
        },

        // Type of product (must be one of the specified types)
        type: {
            type: String,
            enum: ["vinyl", "turntable", "accessory", "merch"], // Only these types are allowed
            required: true, // Field must be provided
        },

        // Information specific to vinyl products (only relevant for 'vinyl' type)
        albumInfo: {
            artist: {
                type: String, // Artist name for the album
                required: false, // Optional field
            },
            genre: {
                type: String, // Genre of the album (e.g., Rock, Jazz)
                required: false, // Optional field
            },
            trackList: {
                type: [String], // List of track names (array of strings)
                required: false, // Optional field
            },
            releaseDate: {
                type: Date, // Release date of the album
                required: false, // Optional field
            },
        },

        // Stock quantity of the product (cannot be negative number)
        stock: {
            type: Number,
            required: true, // Field must be provided
            min: 0, // Stock cannot be negative
        },

        // Array of URLs for product images (optional field)
        images: {
            type: [String], // Array of strings (URLs of product images)
            default: [], // Default to an empty array if no images provided
        },

        // URL for a thumbnail image of the product (optional field)
        thumbnail: {
            type: String, // URL of the thumbnail image
            default: "", // Default to an empty string if no thumbnail provided
        },

        // Brand of the product (optional, can be null for albums)
        brand: {
            type: String, // Brand name (e.g., brand name for turntables or speakers)
            default: null, // Default to null if no brand is provided (e.g., for albums)
        },

        // Timestamp for when the product was created
        createdAt: {
            type: Date,
            default: Date.now, // Automatically set to the current date/time when the product is created
        },
    },
    {
        timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
        versionKey: false, // Removes __v field
    }
);

// Add text indexes with weights
ProductSchema.index(
    {
        name: "text", // Highest priority
        "albumInfo.artist": "text", // Second priority
        brand: "text", // Second priority
        description: "text", // Third priority
        "albumInfo.trackList": "text", // Lowest priority
    },
    {
        weights: {
            name: 10, // Name matches are most important
            "albumInfo.artist": 5, // Artist matches are second
            brand: 5, // Brand matches are second
            description: 3, // Description matches are third
            "albumInfo.trackList": 1, // Track list matches are least important
        },
    }
);

// Create the product model using the schema
const ProductModel = mongoose.model("Product", ProductSchema);

// Export the model so it can be used in other parts of the application
module.exports = {
    ProductModel,
};
