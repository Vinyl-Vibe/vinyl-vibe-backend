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
