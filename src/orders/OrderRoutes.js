const express = require("express");

// Initialize the router
const router = express.Router();

// Import middleware
const {
    validateOrderPayload,
    validateOrderId,
    normaliseOrderStatus
} = require("./OrderMiddleware");

// Import controller functions
const {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    deleteOrder
} = require("./OrderController");

// POST route to create a new order
// Applies `normaliseOrderStatus` to format the status and `validateOrderPayload` to ensure valid data
router.post("/", normaliseOrderStatus, validateOrderPayload, createOrder);

// GET route to fetch all orders (with optional query params for filtering)
// No middleware is needed here as this endpoint fetches orders without requiring payload validation
router.get("/orders", getAllOrders);

// GET route to fetch a specific order by ID
// Applies `validateOrderId` to ensure the order ID in the params is valid
router.get("/orders/:orderId", validateOrderId, getOrderById);

// PUT route to update an existing order by ID
// Applies `validateOrderId` to validate the ID, `normaliseOrderStatus` to format the status,
// and `validateOrderPayload` to ensure the data being updated is valid
router.put("/orders/:orderId", validateOrderId, normaliseOrderStatus, validateOrderPayload, updateOrder);

// DELETE route to cancel an order by ID
// Applies `validateOrderId` to ensure the order ID is valid
router.delete("/orders/:orderId", validateOrderId, deleteOrder);

module.exports = router;

// Model: Defines the schema (structure) for data.
// Service: Contains logic for manipulating data (CRUD operations).
// Controller: Handles HTTP requests, delegates logic to the service and sends back responses.
// Routes: Maps HTTP requests to controller functions.