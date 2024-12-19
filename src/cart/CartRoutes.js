// Importing necessay modules
const express = require("express");
const { 
    getAllCarts, 
    getCart, 
    addItem, 
    updateItemQuantity, 
    removeItem, 
    getFilteredCart 
} = require("./CartController");
const { validateUserAuth } = require("../auth/AuthMiddleware");
const { requireRole } = require("../utils/middleware/roleMiddleware");

// Initilaising the router
const router = express.Router();

/**
 * Cart Routes
 * Why use global middleware?
 * - All cart operations require authentication
 * - Prevents duplicate auth checks
 * - Consistent auth behavior
 */
router.use(validateUserAuth);

/**
 * Cart Routes
 *
 * Route List:
 * 1. GET    /carts                    - Get all carts (admin only)
 * 2. GET    /carts/me                 - Get current user's cart
 * 3. POST   /carts                    - Add a new item to the cart
 * 4. PUT    /carts/:itemId           - Update the quantity of an item in the cart
 * 5. DELETE /carts/:itemId           - Remove an item from the cart
 * 6. GET    /carts/filter            - Filter carts by user ID (admin only)
 */

// Get all carts (admin only)
router.get("/", requireRole('admin'), getAllCarts);

// Get current user's cart
router.get("/me", getCart);

// Add a new item to the cart
router.post("/", addItem);

// Update the quantity of an item in the cart
router.put("/:itemId", requireRole('user'), updateItemQuantity);

// Remove an item from the cart
router.delete("/:itemId", requireRole('user'), removeItem);

// Filter carts by user ID (admin only)
router.get("/filter", requireRole('admin'), getFilteredCart);

// Export the router for use in the application
module.exports = router;

/**
 * Project Structure Overview:
 * - Model: Defines the schema (structure) for data in the database.
 * - Service: Contains logic for manipulating data (CRUD operations).
 * - Controller: Handles HTTP requests, delegates logic to the service, and sends back responses.
 * - Routes: Maps HTTP requests to controller functions.
 */