// Importing necessary modules
const express = require("express");
const { validateUserAuth } = require("../auth/AuthMiddleware");
const { requireRole } = require("../utils/middleware/roleMiddleware");
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("./ProductController");

// Initialize the router
const router = express.Router();

/**
 * Product routes handle product management
 * Public routes don't need auth
 * Admin routes use requireAdmin which includes auth check
 */

// Public routes - no auth needed
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Protected admin-only routes
// Why only requireAdmin?
// - requireAdmin already includes validateUserAuth check
// - Prevents duplicate middleware execution
// - Cleaner route definitions
router.post("/", validateUserAuth, requireRole('admin'), createProduct);
router.patch("/:id", validateUserAuth, requireRole('admin'), updateProduct);
router.delete("/:id", validateUserAuth, requireRole('admin'), deleteProduct);

// Export the router for use in the application
module.exports = router;

// Model: Defines the schema (structure) for data.
// Service: Contains logic for manipulating data (CRUD operations).
// Controller: Handles HTTP requests, delegates logic to the service and sends back responses.
// Routes: Maps HTTP requests to controller functions.
