const express = require("express");

// Initialize the router
const router = express.Router();

// Import middleware
const {
    validateOrderPayload,
    validateOrderId,
    normaliseOrderStatus,
    verifyOrderOwnership
} = require("./OrderMiddleware");

// Import controller functions
const {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    deleteOrder,
    getMyOrders
} = require("./OrderController");

// Import authentication middleware
const { validateUserAuth } = require("../auth/AuthMiddleware");

// Import role-based access control middleware
const { requireRole } = require("../utils/middleware/roleMiddleware");

// Apply authentication middleware to all order routes
router.use(validateUserAuth);

// Regular users can only access their own orders
// This route must come BEFORE the /:orderId route
router.get("/my-orders", getMyOrders);

// GET route to fetch all orders (admin only)
router.get("/", getAllOrders);

// GET route to fetch a specific order by ID
// Applies `validateOrderId` to ensure the order ID in the params is valid
router.get("/:orderId", 
    validateOrderId, 
    getOrderById
);

// POST route to create a new order
// Applies `normaliseOrderStatus` to format the status and `validateOrderPayload` to ensure valid data
router.post("/", normaliseOrderStatus, validateOrderPayload, createOrder);

// PATCH route to update an order (full or partial)
router.patch("/:orderId", 
    validateOrderId, 
    normaliseOrderStatus, 
    validateOrderPayload, 
    updateOrder
);

// DELETE route to cancel an order (admin only)
router.delete("/:orderId", requireRole('admin'), validateOrderId, deleteOrder);

module.exports = router;

// Model: Defines the schema (structure) for data.
// Service: Contains logic for manipulating data (CRUD operations).
// Controller: Handles HTTP requests, delegates logic to the service and sends back responses.
// Routes: Maps HTTP requests to controller functions.