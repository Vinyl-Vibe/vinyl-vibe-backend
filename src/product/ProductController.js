// Importing the ProductModel from the ProductModel.js
const { ProductModel } = require("../product/ProductModel");

// Create a new product
const createProduct = async (request, response) => {
    try {
        // Destructure the request body to get product data
        const { name, description, price, type, albumInfo, stock, images, thumbnail, brand } = request.body;

        // Create a new product using the ProductModel
        const newProduct = new ProductModel({
            name,
            description,
            price,
            type,
            albumInfo,
            stock,
            images,
            thumbnail,
            brand
        });

        // Save the new product to the database
        const product = await newProduct.save();

        // Send back the created product in the response
        return response.status(200).json({
            success: true,
            message: "Product created successfully",
            product
        });
    } catch (error) {
        // Catch and handle errors
        console.error(error);
        return response.status(500).json({
            success: false,
            message: "Server error. Unable to create product."
        });
    }
};

// Get all products
const getAllProducts = async (request, response) => {
    try {
        // Fetch all products from the database
        const products = await ProductModel.find();

        // Send back the list of products
        return response.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        // Handle any errors that might occur
        console.error(error);
        return response.status(500).json({
            success: false,
            message: "Server error. Unable to retrieve products."
        });
    }
};

// Get a single product by ID
const getProductById = async (request, response) => {
    try {
        // Get the product ID from the URL parameters
        const { id } = request.params;

        // Fetch the product from the database
        const product = await ProductModel.findById(id);

        // If the product doesn't exist, send a 404 response
        if (!product) {
            return response.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Return the found product
        return response.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        // Handle any errors, such as invalid ID format
        console.error(error);
        return response.status(500).json({
            success: false,
            message: "Server error. Unable to retrieve product."
        });
    }
};

// Update a product by ID
const updateProduct = async (request, response) => {
    try {
        // Get the product ID from the URL parameters
        const { id } = request.params;

        // Get the updated data from the request body
        const updates = request.body;

        // Find the product by ID and update it
        const product = await ProductModel.findByIdAndUpdate(id, updates, { new: true });

        // If the product doesn't exist, send a 404 response
        if (!product) {
            return response.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Return the updated product
        return response.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        // Handle any errors
        console.error(error);
        return response.status(500).json({
            success: false,
            message: "Server error. Unable to update product."
        });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
};