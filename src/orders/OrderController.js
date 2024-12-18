/**
 * Importing service layer functions for handling business logic.
 * Each function is renamed for clarity and to differentiate them from controller methods.
 * These service functions are responsible for:
 * - Creating orders
 * - Fetching a specific order
 * - Fetching all orders (with optional filters)
 * - Updating an order
 * - Deleting an order
 */
const { 
    createOrder: createOrderService, 
    getOrder: getOrderService, 
    getAllOrders: getAllOrdersService, 
    updateOrder: updateOrderService,
    partialUpdateOrder: partialUpdateOrderService,
    deleteOrder: deleteOrderService 
} = require("./OrderService");

const { VALID_ORDER_STATUSES } = require("./OrderService");
const { AppError } = require("../utils/middleware/errorMiddleware");
const mongoose = require('mongoose');

// Importing the Stripe instance
const { createCheckoutSession } = require('../utils/stripe');
const EmailService = require('../utils/emailService');

// Utility for structured error logging
// This function logs errors in a consistent format to assist with debugging
const logError = (message, error) => {
    console.error(message, { error });
};

// Controller for creating a new order
// Handles the POST /orders endpoint
const createOrder = async (request, response, next) => {
    try {
        const orderData = request.body;
        
        // Set userId based on current user unless admin specifying another user
        if (request.user.role === 'admin' && orderData.userId) {
            // Admin can create order for other users
            if (!mongoose.Types.ObjectId.isValid(orderData.userId)) {
                throw new AppError("Invalid userId format", 400);
            }
        } else {
            // Non-admins or admins not specifying userId use their own ID
            orderData.userId = request.user._id;
        }

        // Create order in pending state
        orderData.status = 'pending';
        const newOrder = await createOrderService(orderData);

        // Create Stripe Checkout session
        const session = await createCheckoutSession(newOrder);

        // Send confirmation email - only send once
        await EmailService.sendOrderConfirmation(request.user.email, newOrder);

        response.status(201).json({
            success: true,
            message: "Order created successfully",
            order: newOrder,
            checkoutUrl: session.url
        });
    } catch (error) {
        next(error);
    }
};

// Controller for getting a specific order by ID
// Handles the GET /orders/:order-id endpoint
const getOrderById = async (request, response, next) => {
    try {
        const { orderId } = request.params; // Get order ID from the URL params

        // Fetch the order from the database
        const order = await getOrderService(orderId);

        // If the order doesn't exist, throw an error
        if (!order) {
            throw new AppError("Order not found", 404);
        }

        // Check if the logged-in user is authorized to view the order
        // Only allow if admin or if it's the user's own order
        // Ensure `request.user._id` matches the `userId` of the order (also ensure they are ObjectId types)
        if (request.user.role !== 'admin' && 
            order.userId.toString() !== request.user._id.toString()) {
            throw new AppError("Not authorised to view this order", 403);
        }

        // If authorised, return the order details
        response.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        next(error); // Pass any error to the error handling middleware
    }
};

// Utility to validate and parse date filters
// This function ensures that the provided date range is valid
const parseDateFilters = (startDate, endDate) => {
    const filters = {}; // Initialize an empty filters object
    if (startDate && endDate) {
        const start = new Date(startDate); // Parse the start date
        const end = new Date(endDate); // Parse the end date
        if (isNaN(start) || isNaN(end)) {
            // Throw an error if either date is invalid
            throw new Error("Invalid date format for startDate or endDate");
        }
        filters.createdAt = {
            $gte: start, // Start date filter (greater than or equal to)
            $lte: end,   // End date filter (less than or equal to)
        };
    }
    return filters; // Return the filters object
};

// Controller for getting all orders with optional filtering
// Handles the GET /orders endpoint with query parameters for filtering
const getAllOrders = async (request, response, next) => {
    try {
        const { status, userId, startDate, endDate } = request.query;
        const filters = {};

        // If not admin, only show user's own orders
        if (request.user.role !== 'admin') {
            filters.userId = request.user._id;
        } else if (userId) {
            // Admin can filter by specific userId if provided
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new AppError("Invalid userId format", 400);
            }
            filters.userId = mongoose.Types.ObjectId(userId);
        }

        // Apply status filter if provided
        if (status) {
            if (!VALID_ORDER_STATUSES.includes(status)) {
                throw new AppError(`Invalid status. Valid values are: ${VALID_ORDER_STATUSES.join(", ")}`, 400);
            }
            filters.status = status;
        }

        // Apply date filters if provided
        Object.assign(filters, parseDateFilters(startDate, endDate));

        console.log("Filters being used:", filters);

        const orders = await getAllOrdersService(filters);

        response.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        next(error);
    }
};

// Combined controller for full or partial order updates
const updateOrder = async (request, response, next) => {
    try {
        const { orderId } = request.params;
        const updateData = request.body;

        // First check if order exists
        const existingOrder = await getOrderService(orderId);
        if (!existingOrder) {
            throw new AppError("Order not found", 404);
        }

        // Check authorization - admin can update any order, users can only update their own
        if (request.user.role !== 'admin' && 
            existingOrder.userId.toString() !== request.user._id.toString()) {
            throw new AppError("Not authorized to update this order", 403);
        }

        const updatedOrder = await updateOrderService(orderId, updateData);

        response.status(200).json({
            success: true,
            message: "Order updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

// Controller for deleting an order (admin only)
const deleteOrder = async (request, response, next) => {
    try {
        const { orderId } = request.params;

        const deletedOrder = await deleteOrderService(orderId);

        if (!deletedOrder) {
            throw new AppError("Order not found", 404);
        }

        response.status(200).json({
            success: true,
            message: "Order deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Controller for getting orders for the currently authenticated user
const getMyOrders = async (request, response, next) => {
    try {
        // Get the user ID from the authenticated user
        const userId = request.user._id;

        // Create filters for the current user
        const filters = { userId: mongoose.Types.ObjectId(userId) };

        // Get orders using the existing service
        const orders = await getAllOrdersService(filters);

        response.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        next(error);
    }
};

// Export all controller functions for use in routes
module.exports = {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    deleteOrder,
    getMyOrders
};
