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
        let query = {};

        // Build an array of conditions that will be combined with $and
        let conditions = [];

        // Enhanced search functionality
        if (queryParams.search) {
            try {
                // Split search terms into words
                const searchWords = queryParams.search.trim().split(/\s+/);

                // Basic search conditions (always included)
                const searchConditions = [
                    { name: { $regex: queryParams.search, $options: "i" } },
                    {
                        "albumInfo.artist": {
                            $regex: queryParams.search,
                            $options: "i",
                        },
                    },
                    { brand: { $regex: queryParams.search, $options: "i" } },
                ];

                // Only add description and trackList if multiple words match
                if (searchWords.length > 1) {
                    // Create a regex pattern that matches all words in sequence
                    const multiWordPattern = searchWords.join("\\s+");

                    // Add description and trackList searches only for multi-word matches
                    searchConditions.push(
                        {
                            description: {
                                $regex: multiWordPattern,
                                $options: "i",
                            },
                        },
                        {
                            "albumInfo.trackList": {
                                $regex: multiWordPattern,
                                $options: "i",
                            },
                        }
                    );
                }

                conditions.push({ $or: searchConditions });
            } catch (searchError) {
                console.error("Search error:", searchError);
                conditions.push({
                    name: { $regex: queryParams.search, $options: "i" },
                });
            }
        }

        // Filter by type
        if (queryParams.type) {
            conditions.push({ type: queryParams.type });
        }

        // Combine all conditions with $and if there are any
        if (conditions.length > 0) {
            query.$and = conditions;
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

        // Handle sorting with more options
        if (queryParams.sort) {
            let sortConfig = {};

            switch (queryParams.sort) {
                case "price-asc":
                    sortConfig.price = 1; // Low to High
                    break;
                case "price-desc":
                    sortConfig.price = -1; // High to Low
                    break;
                case "name-asc":
                    sortConfig.name = 1; // A to Z
                    break;
                case "name-desc":
                    sortConfig.name = -1; // Z to A
                    break;
                case "newest":
                    sortConfig.createdAt = -1; // Newest First
                    break;
                case "oldest":
                    sortConfig.createdAt = 1; // Oldest First
                    break;
                default:
                    sortConfig.createdAt = -1; // Default to newest first
            }

            productsQuery = productsQuery.sort(sortConfig);
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
                    productsPerPage: limit,
                },
            };
        }

        // If no pagination requested, return all products
        return await productsQuery;
    } catch (error) {
        console.error("Product search error:", error);
        throw new AppError(`Error retrieving products: ${error.message}`, 500);
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

        // Log image updates
        if (updates.images || updates.thumbnail !== undefined) {
            console.log(
                "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
                "\n🖼️  Image update for product:",
                existingProduct.name,
                updates.thumbnail === ""
                    ? "\n🗑️  Thumbnail removed"
                    : updates.thumbnail
                    ? "\n✨ New thumbnail added"
                    : "",
                updates.images
                    ? updates.images.length === 0
                        ? "\n🗑️  All images removed"
                        : `\n✨ New images added: ${updates.images.length}`
                    : "",
                "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
            );
        }

        // Handle nested albumInfo updates
        if (updates.albumInfo) {
            updates.albumInfo = {
                ...existingProduct.albumInfo.toObject(),
                ...updates.albumInfo,
            };
        }

        // Use findByIdAndUpdate with $set for partial updates
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { $set: updates },
            {
                new: true,
                runValidators: true,
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
