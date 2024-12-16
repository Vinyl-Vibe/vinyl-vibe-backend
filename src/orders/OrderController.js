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

// Utility for structured error logging
// This function logs errors in a consistent format to assist with debugging
const logError = (message, error) => {
    console.error(message, { error });
};

// Controller for creating a new order
// Handles the POST /orders endpoint
const createOrder = async (request, response) => {
    try {
        const orderData = request.body; // Extract order details from the request body
        const newOrder = await createOrderService(orderData); // Pass order details to the service to create the order

        // Respond with the created order and success message
        response.status(201).json({
            success: true,
            message: "Order created successfully",
            order: newOrder,
        });
    } catch (error) {
        logError("Error in createOrder", error); // Log error for debugging
        response.status(500).json({
            success: false,
            message: "Server error, unable to create order",
        });
    }
};

// Controller for getting a specific order by ID
// Handles the GET /orders/:order-id endpoint
const getOrderById = async (request, response) => {
    try {
        const { orderId } = request.params; // Extract the order ID from URL parameters

        // Validate that the order ID is provided
        if (!orderId) {
            return response.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        const order = await getOrderService(orderId); // Fetch the order details from the service

        // If the order is not found, respond with a 404 error
        if (!order) {
            return response.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Respond with the order details
        response.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        logError("Error in getOrderById", error); // Log error for debugging
        response.status(500).json({
            success: false,
            message: "Server error, unable to fetch order",
        });
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
const getAllOrders = async (request, response) => {
    try {
        const { status, userId, startDate, endDate } = request.query; // Extract query parameters

        // Filters object to be passed to the service layer
        const filters = {};
        if (status) {
            const validStatuses = ["pending", "completed", "canceled", "shipped"]; // Define valid statuses
            if (!validStatuses.includes(status)) {
                return response.status(400).json({
                    success: false,
                    message: `Invalid status value. Valid values are: ${validStatuses.join(", ")}`,
                });
            }
            filters.status = status; // Add status filter if valid
        }
        if (userId) filters.userId = userId; // Add user ID filter if provided
        Object.assign(filters, parseDateFilters(startDate, endDate)); // Add date filters

        const orders = await getAllOrdersService(filters); // Fetch filtered orders from the service

        // Respond with the filtered list of orders
        response.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        if (error.message.includes("Invalid date format")) {
            // Respond with a 400 error if date validation fails
            return response.status(400).json({
                success: false,
                message: error.message,
            });
        }
        logError("Error in getAllOrders", error); // Log error for debugging
        response.status(500).json({
            success: false,
            message: "Server error, unable to fetch orders",
        });
    }
};

// Controller for updating an entire order by ID
// Handles the PUT /orders/:order-id endpoint
const updateOrder = async (request, response) => {
    try {
        const { orderId } = request.params; // Extract the order ID from URL parameters
        const updatedData = request.body; // Extract updated order details from the request body

        // Validate that the order ID is provided
        if (!orderId) {
            return response.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        const allowedFields = ["status", "items", "totalPrice"]; // Define allowed fields for update
        const sanitizedData = Object.keys(updatedData).reduce((acc, key) => {
            // Filter out fields that are not allowed
            if (allowedFields.includes(key)) {
                acc[key] = updatedData[key];
            }
            return acc;
        }, {});

        const updatedOrder = await updateOrderService(orderId, sanitizedData); // Update the order using the service

        // If the order is not found, respond with a 404 error
        if (!updatedOrder) {
            return response.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Respond with the updated order details
        response.status(200).json({
            success: true,
            message: "Order updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        logError("Error in updateOrder", error); // Log error for debugging
        response.status(500).json({
            success: false,
            message: "Server error, unable to update order",
        });
    }
};

// Controller for partially updating an order by ID
// Handles the PATCH /orders/:order-id endpoint
const partialUpdateOrder = async (request, response) => {
    try {
        const { orderId } = request.params; // Extract order ID from the URL
        const updateFields = request.body; // Extract fields to update from the request body

        // Call the service to perform the update
        const updatedOrder = await partialUpdateOrderService(orderId, updateFields); // Service will handle partial updates

        if (!updatedOrder) {
            return response.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        response.status(200).json({
            success: true,
            message: "Order updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Error in partialUpdateOrder:", error);
        response.status(500).json({
            success: false,
            message: "Server error, unable to update order",
        });
    }
};

// Controller for deleting an order (canceling) by ID
// Handles the DELETE /orders/:order-id endpoint
const deleteOrder = async (request, response) => {
    try {
        const { orderId } = request.params; // Extract the order ID from URL parameters

        // Validate that the order ID is provided
        if (!orderId) {
            return response.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        const deletedOrder = await deleteOrderService(orderId); // Attempt to delete the order using the service

        // If the order is not found, respond with a 404 error
        if (!deletedOrder) {
            return response.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Respond with a success message upon successful deletion
        response.status(200).json({
            success: true,
            message: "Order deleted successfully",
        });
    } catch (error) {
        if (error.message.includes("foreign key constraint")) {
            // Respond with a 400 error if there are associated dependencies preventing deletion
            return response.status(400).json({
                success: false,
                message: "Cannot delete order due to associated dependencies.",
            });
        }
        logError("Error in deleteOrder", error); // Log error for debugging
        response.status(500).json({
            success: false,
            message: "Server error, unable to delete order",
        });
    }
};

// Export all controller functions for use in routes
module.exports = {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    partialUpdateOrder,
    deleteOrder,
};
