// Importing necessary modules
const express = require("express");
const {
	createProduct,
	getAllProducts,
	getProductById,
	updateProduct,
	deleteProduct,
} = require("./ProductController");
const { requireAdmin } = require('../utils/middleware/roleMiddleware')

// Initialize the router
const router = express.Router();

/**
 * Product routes handle product management
 * Public routes don't need auth
 * Admin routes use requireAdmin which includes auth check
 */

// Public routes - no auth needed
router.get('/', getAllProducts)
router.get('/:id', getProductById)

// Protected admin-only routes
// Why only requireAdmin?
// - requireAdmin already includes validateUserAuth check
// - Prevents duplicate middleware execution
// - Cleaner route definitions
router.post('/', requireAdmin, createProduct)
router.put('/:id', requireAdmin, updateProduct)
router.delete('/:id', requireAdmin, deleteProduct)

// Export the router for use in the application
module.exports = router;

// Model: Defines the schema (structure) for data.
// Service: Contains logic for manipulating data (CRUD operations).
// Controller: Handles HTTP requests, delegates logic to the service and sends back responses.
// Routes: Maps HTTP requests to controller functions.
