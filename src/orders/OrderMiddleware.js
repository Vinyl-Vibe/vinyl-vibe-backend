/**
 * Middleware functions specific to order operations.
 * These are used to validate, transform, or authorise requests
 * before they reach the service or controller layer.
 */

// Validate the payload for creating or updating an order
// Ensures that all required fields are present and valid
const validateOrderPayload = (request, response, next) => {
    // console.log("Request Body in validateOrderPayload:", request.body);

    const { products, total, status } = request.body;

    if (!Array.isArray(products) || products.length === 0) {
        return response.status(400).json({
            success: false,
            message: "Order must include at least one item."
        });
    }

    if (typeof total !== "number" || total <= 0) {
        return response.status(400).json({
            success: false,
            message: "Total price must be a positive number."
        });
    }

    const validStatuses = ["pending", "completed", "canceled", "shipped"];
    if (!validStatuses.includes(status)) {
        return response.status(400).json({
            success: false,
            message: `Invalid status. Valid statuses are: ${validStatuses.join(", ")}`
        });
    }

    next(); // Proceed to the next middleware or controller
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
            message: "Invalid order ID format."
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

// Export middleware functions for use in routes
module.exports = {
    validateOrderPayload,
    validateOrderId,
    normaliseOrderStatus
};
