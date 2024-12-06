
// Importing necessary modules
const express = require("express");
const { 
    createProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct 
} = require("../product/ProductController");

// Initialize the router
const router = express.Router();

// Route to create a new product
// POST /api/products
router.post("/products", createProduct);

// Route to get all products
// GET /api/products
router.get("/products", getAllProducts);

// Route to get a single product by ID
// GET /api/products/:id
router.get("/products/:id", getProductById);

// Route to update a product by ID
// PUT /api/products/:id
router.put("/products/:id", updateProduct);

// Route to delete a product by ID
// DELETE /api/products/:id
router.delete("/products/:id", deleteProduct);

// Export the router for use in the application
module.exports = router;




// Model: Defines the schema (structure) for data.
// Service: Contains logic for manipulating data (CRUD operations).
// Controller: Handles HTTP requests, delegates logic to the service and sends back responses.
// Routes: Maps HTTP requests to controller functions.