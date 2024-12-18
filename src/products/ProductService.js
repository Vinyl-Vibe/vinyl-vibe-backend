// Import the ProductModel to interact with the MongoDB database
const { ProductModel } = require("./ProductModel");
const { AppError } = require("../utils/middleware/errorMiddleware");

// Mongoose Methods; save(), find(), findById(), findByIdAndUpdate()
// and findByIdAndDelete() are used to interact with the database.

//Service function to create a new product.

const createProduct = async (productData) => {
    try {
        // Create a new product instance using the data provided
        const newProduct = new ProductModel(productData);
        // Save the new product to the database and return the saved document
        return await newProduct.save();
    } catch (error) {
        // Throw an error if something goes wrong
        throw new AppError(`Failed to create product: ${error.message}`, 500);
    }
};

//Service function to retrieve all products from the database.

const getAllProducts = async (queryParams) => {
    try {
        // Start with an empty query object
        let query = {};

        // Filter by type
        // URL Examples:
        // /products?type=vinyl
        // /products?type=turntable
        // /products?type=accessory
        // /products?type=speaker
        if (queryParams.type) {
            query.type = queryParams.type;
        }

        // Search by name (case-insensitive)
        // URL Examples:
        // /products?search=Dark Side of the Moon
        // /products?search=Beatles
        // /products?search=Pro-Ject
        if (queryParams.search) {
            query.name = { $regex: queryParams.search, $options: "i" };
        }

        // Filter by price range
        // URL Examples:
        // /products?price-min=20&price-max=50    (products between $20 and $50)
        // /products?price-min=100                (products $100 and above)
        // /products?price-max=30                 (products $30 and below)
        if (queryParams["price-min"] || queryParams["price-max"]) {
            query.price = {};
            if (queryParams["price-min"]) {
                query.price.$gte = Number(queryParams["price-min"]);
            }
            if (queryParams["price-max"]) {
                query.price.$lte = Number(queryParams["price-max"]);
            }
        }

        // Filter by stock availability
        // URL Example:
        // /products?in-stock=true                (only show products with stock > 0)
        if (queryParams["in-stock"] === "true") {
            query.stock = { $gt: 0 };
        }

        // Filter by stock unavailability
        // URL Example:
        // /products?in-stock=false                (only show products with stock = 0)
        if (queryParams["in-stock"] === "false") {
            query.stock = { $eq: 0 };
        }

        // Create the base query
        let productsQuery = ProductModel.find(query);

        // Handle sorting
        // URL Examples:
        // /products?sort=price&order=asc         (sort by price, lowest first)
        // /products?sort=price&order=desc        (sort by price, highest first)
        // /products?sort=name&order=asc          (sort alphabetically A-Z)
        // /products?sort=name&order=desc         (sort alphabetically Z-A)
        if (queryParams.sort) {
            const sortOrder = queryParams.order === "desc" ? -1 : 1;
            productsQuery = productsQuery.sort({
                [queryParams.sort]: sortOrder,
            });
        }

        // Handle pagination if page and limit are provided
        if (queryParams.page || queryParams.limit) {
            const page = parseInt(queryParams.page) || 1;
            const limit = parseInt(queryParams.limit) || 10;
            const skip = (page - 1) * limit;

            productsQuery = productsQuery.skip(skip).limit(limit);

            // Get total count for pagination metadata
            const total = await ProductModel.countDocuments(query);

            // Execute the query
            const products = await productsQuery;

            // Return pagination metadata along with products
            return {
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalProducts: total,
                    productsPerPage: limit
                }
            };
        }

        // If no pagination requested, return all products
        return await productsQuery;
    } catch (error) {
        throw error;
    }
};

// Service function to retrieve a single product by its ID.

const getProductById = async (productId) => {
    try {
        const product = await ProductModel.findById(productId);
        if (!product) {
            throw new AppError("Product not found", 404);
        }
        return product;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`Error retrieving product: ${error.message}`, 500);
    }
};

/**
 * Update product in database
 * Why use $set for updates?
 * - Only updates specified fields
 * - Maintains other fields unchanged
 * - Atomic operation prevents race conditions
 */
const updateProduct = async (productId, updates) => {
    try {
        // First check if product exists
        const existingProduct = await ProductModel.findById(productId);
        if (!existingProduct) {
            throw new AppError("Product not found", 404);
        }

        // Handle nested albumInfo updates
        if (updates.albumInfo) {
            // Only update provided albumInfo fields
            updates.albumInfo = {
                ...existingProduct.albumInfo.toObject(),
                ...updates.albumInfo
            };
        }

        // Use findByIdAndUpdate with $set for partial updates
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { $set: updates },
            { 
                new: true,          // Return updated document
                runValidators: true // Run schema validators
            }
        );

        if (!updatedProduct) {
            throw new AppError("Product not found", 404);
        }

        return updatedProduct;
    } catch (error) {
        if (error.isOperational) throw error;
        throw new AppError(`Error updating product: ${error.message}`, 500);
    }
};

/**
 * Delete product from database
 * Why use findByIdAndDelete?
 * - Atomic operation
 * - Returns deleted document
 * - Handles ObjectId casting
 */
const deleteProduct = async (productId) => {
    try {
        // Why not use deleteOne()?
        // - Need to know if product existed
        // - Want to return deleted product if needed
        // - Consistent with other finder methods
        const deletedProduct = await ProductModel.findByIdAndDelete(productId);

        if (!deletedProduct) {
            throw new AppError("Product not found", 404);
        }

        return deletedProduct;
    } catch (error) {
        // Why separate error handling?
        // - Preserve custom error types
        // - Add context to database errors
        // - Consistent error format
        if (error instanceof AppError) throw error;
        throw new AppError(`Error deleting product: ${error.message}`, 500);
    }
};

// Export all service functions so they can be used in other parts of the application
module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
