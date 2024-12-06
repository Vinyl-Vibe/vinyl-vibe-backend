// Importing necessary modules
const express = require("express");
const {
	createProduct,
	getAllProducts,
	getProductById,
	updateProduct,
	deleteProduct,
} = require("../product/ProductController");

// Initialize the router
const router = express.Router();

// Route to create a new product
// POST /products
router.post("/", createProduct);

// Route to get all products
// GET /products
router.get("/", getAllProducts);

// Route to get a single product by ID
// GET /products/:id
router.get("/:id", getProductById);

// Route to update a product by ID
// PUT /products/:id
router.put("/:id", updateProduct);

// Route to delete a product by ID
// DELETE /products/:id
router.delete("/:id", deleteProduct);

// Export the router for use in the application
module.exports = router;

// Model: Defines the schema (structure) for data.
// Service: Contains logic for manipulating data (CRUD operations).
// Controller: Handles HTTP requests, delegates logic to the service and sends back responses.
// Routes: Maps HTTP requests to controller functions.
