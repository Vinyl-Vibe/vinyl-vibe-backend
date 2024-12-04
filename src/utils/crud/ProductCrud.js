// Provide CRUD functions for the ProductModel

const { ProductModel } = require("../../models/ProductModel");

async function createProduct(name, sku) {
    try {
        const result = await ProductModel.create({
            name: name, // Use the function's parameter
            sku: sku    // Use the function's parameter
        });

        return result; // Return the created product
    } catch (error) {
        console.error("Error creating product:", error.message);
        throw error; // Re-throw the error for further handling
    }
}

async function findOneProduct() {
    
}

async function findManyProducts() {
    
}

async function updateOneProduct() {
    
}

async function updateManyProducts() {
    
}

async function deleteOneProduct() {

}

async function deleteManyProducts() {

}

module.exports = {
    createProduct,
    findOneProduct, findManyProducts,
    updateOneProduct, updateManyProducts,
    deleteOneProduct, deleteManyProducts
}