/**
 * Middleware functions specific to order operations.
 * These are used to validate, transform, or authorise requests
 * before they reach the service or controller layer.
 */

const { AppError } = require("../utils/middleware/errorMiddleware");
const { OrderModel } = require("./OrderModel");
const { VALID_ORDER_STATUSES } = require("./OrderService");

// Validate the payload for creating or updating an order
const validateOrderPayload = (request, response, next) => {
    const { products, total, status } = request.body;

    // If the request includes products, validate it
    if (products && (!Array.isArray(products) || products.length === 0)) {
        return response.status(400).json({
            success: false,
            message: "Order must include at least one item.",
        });
    }

    // If the request includes total, validate it
    if (total && (typeof total !== "number" || total <= 0)) {
        return response.status(400).json({
            success: false,
            message: "Total price must be a positive number.",
        });
    }

    // Validate the status if it is provided
    if (status && !VALID_ORDER_STATUSES.includes(status?.toLowerCase())) {
        return response.status(400).json({
            success: false,
            message: `Invalid status. Valid statuses are: ${VALID_ORDER_STATUSES.join(", ")}`,
        });
    }

    next();
};

// Middleware to validate the order ID in the request params
// Ensures that the order ID is a valid MongoDB ObjectId
const validateOrderId = (request, response, next) => {
    const { orderId } = request.params;

    // Check if the `orderId` is missing or does not match the expected MongoDB ObjectId format.
    // A valid MongoDB ObjectId is a 24-character hexadecimal string.
    // If the validation fails, respond with a 400 status code and an error message.
    if (!orderId || !/^[a-fA-F0-9]{24}$/.test(orderId)) {
        return response.status(400).json({
            success: false,
            message: "Invalid order ID format.",
        });
    }

    next(); // Proceed to the next middleware or controller
};

// Transform the status field in the request body to lowercase
// Ensures consistency in how statuses are stored
const normaliseOrderStatus = (request, response, next) => {
    if (request.body.status) {
        request.body.status = request.body.status.toLowerCase();
    }

    next(); // Proceed to the next middleware or controller
};

const verifyOrderOwnership = async (req, res, next) => {
    try {
        const order = await OrderModel.findById(req.params.orderId);
        if (!order) {
            throw new AppError("Order not found", 404);
        }

        if (
            order.userId.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            throw new AppError("Not authorized to access this order", 403);
        }

        req.order = order; // Attach order to request for later use
        next();
    } catch (error) {
        next(error);
    }
};

// Export middleware functions for use in routes
module.exports = {
    validateOrderPayload,
    validateOrderId,
    normaliseOrderStatus,
    verifyOrderOwnership,
};
