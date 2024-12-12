const express = require("express");

// Initialize the router
const router = express.Router();

const {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    deleteOrder
} = require("./OrderController");

// POST route to create a new order
router.post("/orders", createOrder);

// GET route to fetch all orders (with optional query params for filtering)
router.get("/orders", getAllOrders);

// GET route to fetch a specific order by ID
router.get("/orders/:orderId", getOrderById);

// PUT route to update an existing order by ID
router.put("/orders/:orderId", updateOrder);

// DELETE route to cancel an order by ID
router.delete("/orders/:orderId", deleteOrder);

module.exports = router;


// Model: Defines the schema (structure) for data.
// Service: Contains logic for manipulating data (CRUD operations).
// Controller: Handles HTTP requests, delegates logic to the service and sends back responses.
// Routes: Maps HTTP requests to controller functions.