// Importing necessay modules
const express = require("express");
const { 
    getCart, 
    addItem, 
    updateItemQuantity, 
    removeItem, 
    getFilteredCart 
} = require("./CartController");
const { validateUserAuth } = require("../utils/middleware/authMiddleware");

// Initilaising the router
const router = express.Router();

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

/**
 * Middleware:
 * - `validateUserAuth`: Ensures the user is authenticated before accessing any cart routes.
 */

// Retrieve the current cart for the authenticated user
// GET /cart
router.get("/", validateUserAuth, getCart);

// Add a new item to the cart
// POST /cart
router.post("/", validateUserAuth, addItem);

// Update the quantity of an item in the cart
// PUT /cart/:itemId 
router.put("/:itemId", validateUserAuth, updateItemQuantity);

// Remove an item from the cart
// DELETE /cart/:itemId
router.delete("/:itemId", validateUserAuth, removeItem);

// Retrieve a cart filtered by user ID (query parameter)
// GET /cart?user-id=<userId>
router.get("/filter", validateUserAuth, getFilteredCart);

module.exports = router;