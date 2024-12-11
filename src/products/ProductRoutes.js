// Importing necessary modules
const express = require("express");
const {
	createProduct,
	getAllProducts,
	getProductById,
	updateProduct,
	deleteProduct,
} = require("./ProductController");
const { validateUserAuth } = require('../auth/AuthMiddleware')
const { requireAdmin } = require('../utils/middleware/roleMiddleware')

// Initialize the router
const router = express.Router();

// Public routes
router.get('/', getAllProducts) // Allow public access to view products
router.get('/:id', getProductById) // Allow public access to view single product

// Protected admin-only routes
// Why both validateJWT and requireAdmin?
// - validateJWT verifies the token and adds user to request
// - requireAdmin checks if the user has admin role
router.post('/', validateUserAuth, requireAdmin, createProduct)
router.put('/:id', validateUserAuth, requireAdmin, updateProduct)
router.delete('/:id', validateUserAuth, requireAdmin, deleteProduct)

// Export the router for use in the application
module.exports = router;

// Model: Defines the schema (structure) for data.
// Service: Contains logic for manipulating data (CRUD operations).
// Controller: Handles HTTP requests, delegates logic to the service and sends back responses.
// Routes: Maps HTTP requests to controller functions.
