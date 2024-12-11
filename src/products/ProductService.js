// Import the ProductModel to interact with the MongoDB database
const { ProductModel } = require("./ProductModel");

// Mongoose Methods; save(), find(), findById(), findByIdAndUpdate()
// and findByIdAndDelete() are used to interact with the database.

// Service function to create a new product.
const createProduct = async (productData) => {
    try {
        // Create a new product instance using the data provided
        const newProduct = new ProductModel(productData);
        // Save the new product to the database and return the saved document
        return await newProduct.save();
    } catch (error) {
        // Throw an error if something goes wrong
        throw new Error(`Error creating product: ${error.message}`);
    }
};

// Service function to retrieve all products from the database with filtering and sorting
const getAllProducts = async (query) => {
    try {
        // Destructure query parameters
        const { type, search, 'price-min': priceMin, 'price-max': priceMax, 'in-stock': inStock, sort, order } = query;

        // Build the filter object based on query parameters
        let filter = {};

        // Add filter for 'type'
        if (type) {
            filter.type = type;
        }

        // Add filter for 'search' (case-insensitive search on name)
        if (search) {
            filter.name = { $regex: search, $options: 'i' }; // case-insensitive search
        }

        // Add filter for price range
        if (priceMin || priceMax) {
            filter.price = {};
            if (priceMin) {
                filter.price.$gte = parseFloat(priceMin); // greater than or equal to priceMin
            }
            if (priceMax) {
                filter.price.$lte = parseFloat(priceMax); // less than or equal to priceMax
            }
        }

        // Filter by in-stock products
        if (inStock === 'true') {
            filter.stock = { $gt: 0 }; // Only products with stock greater than 0
        }

        // Handle sorting if 'sort' and 'order' parameters are present
        let sortOptions = {};
        if (sort) {
            sortOptions[sort] = order === 'asc' ? 1 : -1; // Ascending or descending order
        }

        // Fetch products from the database with applied filters and sorting
        const products = await ProductModel.find(filter).sort(sortOptions);

        // Return the filtered and sorted products
        return products;
    } catch (error) {
        // Throw an error if something goes wrong
        throw new Error(`Error retrieving products: ${error.message}`);
    }
};

// Service function to retrieve a single product by its ID.
const getProductById = async (productId) => {
    try {
        // Use Mongoose's `findById` method to get the product by its ID
        const product = await ProductModel.findById(productId);
        // If no product is found, throw a custom error
        if (!product) {
            throw new Error("Product not found");
        }
        // Return the found product
        return product;
    } catch (error) {
        // Throw an error if something goes wrong
        throw new Error(`Error retrieving product: ${error.message}`);
    }
};

// Service function to update a product by its ID.
const updateProduct = async (productId, productData) => {
    try {
        // Use Mongoose's `findByIdAndUpdate` method to update the product
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,           // The ID of the product to update
            productData,         // The new data for the product
            { new: true, runValidators: true } // Return the updated document and validate new data
        );
        // If no product is found, throw a custom error
        if (!updatedProduct) {
            throw new Error("Product not found");
        }
        // Return the updated product
        return updatedProduct;
    } catch (error) {
        // Throw an error if something goes wrong
        throw new Error(`Error updating product: ${error.message}`);
    }
};

// Service function to delete a product by its ID.
const deleteProduct = async (productId) => {
    try {
        // Use Mongoose's `findByIdAndDelete` method to delete the product
        const deletedProduct = await ProductModel.findByIdAndDelete(productId);
        // If no product is found, throw a custom error
        if (!deletedProduct) {
            throw new Error("Product not found");
        }
        // Return the deleted product
        return deletedProduct;
    } catch (error) {
        // Throw an error if something goes wrong
        throw new Error(`Error deleting product: ${error.message}`);
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
