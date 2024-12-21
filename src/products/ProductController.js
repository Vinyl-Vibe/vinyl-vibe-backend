// Importing the ProductModel from the ProductModel.js
const { ProductModel } = require("./ProductModel");
const ProductService = require("./ProductService");
const { AppError } = require("../utils/middleware/errorMiddleware");
const cloudinary = require("../utils/cloudinary");

// Create a new product
const createProduct = async (request, response, next) => {
    try {
        const productData = request.body;
        const product = await ProductService.createProduct(productData);

        console.log(
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
            "\n✨ New product created by:",
            request.user?.email || "Unknown user",
            "\n   Name:",
            productData.name,
            "\n   Type:",
            productData.type,
            "\n   Price: $",
            productData.price,
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
        );

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
        const result = await ProductService.getAllProducts(request.query);

        // Check if result includes pagination metadata
        if (result.pagination) {
            return response.status(200).json({
                success: true,
                ...result,
            });
        }

        // Return regular response for non-paginated results
        return response.status(200).json({
            success: true,
            products: result,
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
 * Update a product by ID (admin only)
 * Why PATCH instead of PUT?
 * - Allows partial updates
 * - More efficient for small changes
 * - Better represents the intent of the operation
 */
const updateProduct = async (request, response, next) => {
    try {
        const { id } = request.params;
        const updates = request.body;

        // Validate allowed fields for partial update
        const allowedFields = [
            "name",
            "description",
            "price",
            "type",
            "stock",
            "brand",
            "images",
            "thumbnail",
            "albumInfo",
        ];

        // Check for invalid fields
        const invalidFields = Object.keys(updates).filter(
            (key) => !allowedFields.includes(key)
        );

        if (invalidFields.length > 0) {
            throw new AppError(
                `Invalid fields: ${invalidFields.join(
                    ", "
                )}. Allowed fields: ${allowedFields.join(", ")}`,
                400
            );
        }

        // If updating albumInfo, validate its fields
        if (updates.albumInfo) {
            const allowedAlbumFields = [
                "artist",
                "genre",
                "trackList",
                "releaseDate",
            ];
            const invalidAlbumFields = Object.keys(updates.albumInfo).filter(
                (key) => !allowedAlbumFields.includes(key)
            );

            if (invalidAlbumFields.length > 0) {
                throw new AppError(
                    `Invalid albumInfo fields: ${invalidAlbumFields.join(
                        ", "
                    )}`,
                    400
                );
            }
        }

        const product = await ProductService.updateProduct(id, updates);

        return response.status(200).json({
            success: true,
            message: "Product updated successfully",
            product,
        });
    } catch (error) {
        next(
            new AppError(
                error.message || "Failed to update product",
                error.status || 500
            )
        );
    }
};

/**
 * Delete a product by ID
 * Why soft delete not implemented?
 * - Business requirement for permanent deletion
 * - No audit requirement for deleted products
 * - Simplifies data management
 */
const deleteProduct = async (request, response, next) => {
    try {
        const { id } = request.params;

        // Why use service layer for deletion?
        // - Consistent business logic
        // - Future-proof for soft delete implementation
        // - Centralised database operations
        const product = await ProductService.deleteProduct(id);

        if (!product) {
            return next(new AppError("Product not found", 404));
        }

        // Why not return deleted product?
        // - No need for deleted data on client
        // - Reduces response payload
        // - Clear indication of successful deletion
        return response.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        next(new AppError("Failed to delete product", 500));
    }
};

const deleteProductImage = async (request, response, next) => {
    try {
        const { publicId } = request.params;

        const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            resource_type: "image",
            type: "authenticated",
        });

        if (result.result === "ok") {
            console.log(
                "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
                "\n🔍️  Deleting image:",
                publicId,
                "\n✅ Image deleted successfully",
                "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––"
            );

            return response.status(200).json({
                status: "success",
                message: "Image deleted successfully",
                publicId: publicId,
            });
        }

        throw new AppError("Failed to delete image", 400);
    } catch (error) {
        console.error("\n❌ Image deletion failed:", error.message);
        next(new AppError(`Failed to delete image: ${error.message}`, 500));
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    deleteProductImage,
};
