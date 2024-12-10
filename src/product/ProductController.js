// Importing the ProductModel from the ProductModel.js
const { ProductModel } = require("../product/ProductModel");
const ProductService = require("./ProductService");

// Create a new product
const createProduct = async (request, response) => {
    try {
        const productData = request.body;
        const product = await ProductService.createProduct(productData);

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

// Delete a product by ID
const deleteProduct = async (request, response) => {
    try {
        // Get the product ID from the URL parameters
        const { id } = request.params;

        // Delete the product by its ID
        const product = await ProductModel.findByIdAndDelete(id);

        // If the product doesn't exist, send a 404 response
        if (!product) {
            return response.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Return a success message
        return response.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        // Handle any errors
        console.error(error);
        return response.status(500).json({
            success: false,
            message: "Server error. Unable to delete product."
        });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};