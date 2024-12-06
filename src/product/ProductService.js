// Import the ProductModel to interact with the database
const { ProductModel } = require("../product/ProductModel");

// Service function to create a new product
const createProduct = async (productData) => {
    try {
        // Create a new product instance and save it to the database
        const newProduct = new ProductModel(productData);
        return await newProduct.save();
    } catch (error) {
        throw new Error(`Error creating product: ${error.message}`);
    }
};

// Service function to retrieve all products
const getAllProducts = async () => {
    try {
        return await ProductModel.find(); // Retrieve all products
    } catch (error) {
        throw new Error(`Error retrieving products: ${error.message}`);
    }
};


// Export all service functions
module.exports = {
    createProduct,
    getAllProducts
};
