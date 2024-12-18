// Importing necessay modules
const express = require("express");
const { 
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
 * 1. GET    /cart                     - Retrieve the current cart for the authenticated user
 * 2. POST   /cart                     - Add a new item to the cart
 * 3. PUT    /cart/:itemId             - Update the quantity of an item in the cart
 * 4. DELETE /cart/:itemId             - Remove an item from the cart
 * 5. GET    /cart?user-id=<userId>    - Retrieve a cart filtered by user ID (search/filter)
 */

// Retrieve the current cart for the authenticated user
// GET /cart
router.get("/", getCart);

// Add a new item to the cart
// POST /cart
router.post("/", addItem);

// Update the quantity of an item in the cart
// PUT /cart/:itemId 
router.put("/:itemId", requireRole('user'), updateItemQuantity);

// Remove an item from the cart
// DELETE /cart/:itemId
router.delete("/:itemId", requireRole('user'), removeItem);

// Retrieve a cart filtered by user ID (query parameter)
// GET /cart?user-id=<userId>
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