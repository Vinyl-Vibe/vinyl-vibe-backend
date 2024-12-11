// Importing the ProductModel from the ProductModel.js
const { ProductModel } = require("./ProductModel");
const ProductService = require("./ProductService");
const { AppError } = require("../utils/middleware/errorMiddleware");

// Create a new product
const createProduct = async (request, response, next) => {
    try {
        const productData = request.body;
        const product = await ProductService.createProduct(productData);

        // Send back the created product in the response
        return response.status(200).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        // Use next(error) to pass to error handling middleware
        next(new AppError("Failed to create product", 500));
    }
};

// Get all products (with optional filter by type)
const getAllProducts = async (request, response, next) => {
    try {
        // Pass query parameters to the service
        const products = await ProductService.getAllProducts(request.query);

        return response.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        next(new AppError("Failed to retrieve products", 500));
    }
};

// Get a single product by ID
const getProductById = async (request, response, next) => {
    try {
        // Get the product ID from the URL parameters
        const { id } = request.params;

        // Fetch the product from the database
        const product = await ProductService.getProductById(id);

        // If the product doesn't exist, send a 404 response
        if (!product) {
            return next(new AppError("Product not found", 404));
        }

        // Return the found product
        return response.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        next(new AppError("Failed to retrieve product", 500));
    }
};

/**
 * Update a product by ID
 * Why separate update logic in controller/service?
 * - Controller handles HTTP concerns (request/response)
 * - Service handles business logic and database operations
 * - Keeps code modular and testable
 */
const updateProduct = async (request, response, next) => {
    try {
        const { id } = request.params
        const updates = request.body
        
        // Why await here instead of .then()?
        // - Cleaner error handling with try/catch
        // - More readable synchronous-style code
        // - Easier to debug with stack traces
        const product = await ProductService.updateProduct(id, updates)
        
        // Why check for product existence here AND in service?
        // - Service ensures data integrity
        // - Controller ensures proper HTTP response
        // - Defence in depth principle
        if (!product) {
            return next(new AppError('Product not found', 404))
        }

        // Why return a success message AND the updated product?
        // - Message provides user feedback
        // - Updated product lets client update UI without refetch
        // - Follows REST best practices
        return response.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product
        })
    } catch (error) {
        // Why use AppError with next()?
        // - Consistent error format across API
        // - Centralised error handling
        // - Proper error logging
        next(new AppError('Failed to update product', 500))
    }
}

/**
 * Delete a product by ID
 * Why soft delete not implemented?
 * - Business requirement for permanent deletion
 * - No audit requirement for deleted products
 * - Simplifies data management
 */
const deleteProduct = async (request, response, next) => {
    try {
        const { id } = request.params
        
        // Why use service layer for deletion?
        // - Consistent business logic
        // - Future-proof for soft delete implementation
        // - Centralised database operations
        const product = await ProductService.deleteProduct(id)
        
        if (!product) {
            return next(new AppError('Product not found', 404))
        }

        // Why not return deleted product?
        // - No need for deleted data on client
        // - Reduces response payload
        // - Clear indication of successful deletion
        return response.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        })
    } catch (error) {
        next(new AppError('Failed to delete product', 500))
    }
}

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
