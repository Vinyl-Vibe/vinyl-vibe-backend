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
    deleteOrder: deleteOrderService,
} = require("./OrderService");

const { VALID_ORDER_STATUSES } = require("./OrderService");
const { AppError } = require("../utils/middleware/errorMiddleware");
const mongoose = require("mongoose");

// Importing the Stripe instance
const { createCheckoutSession } = require("../utils/stripe");
const EmailService = require("../utils/emailService");

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

        // Only need userId and status initially
        orderData.userId = request.user._id;
        orderData.status = "pending"; // Order starts as pending

        // Create order without shipping address
        const newOrder = await createOrderService(orderData);

        // Create Stripe session for payment
        const session = await createCheckoutSession(newOrder);

        console.log(
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
            "\n📦 New order created by:",
            request.user?.email || "Unknown user",
            "\n💵 order total: $",
            newOrder.total,
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
        );

        // Return checkout URL to frontend
        response.status(201).json({
            success: true,
            message: "Order created successfully",
            order: newOrder,
            checkoutUrl: session.url,
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
        if (
            request.user.role !== "admin" &&
            order.userId.toString() !== request.user._id.toString()
        ) {
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
            $lte: end, // End date filter (less than or equal to)
        };
    }
    return filters; // Return the filters object
};

// Controller for getting all orders with optional filtering
// Handles the GET /orders endpoint with query parameters for filtering
const getAllOrders = async (request, response, next) => {
    try {
        const { status, userId, startDate, endDate, page, limit } =
            request.query;
        const filters = {};

        // Only apply pagination if either page or limit is provided
        let usePagination = page !== undefined || limit !== undefined;
        let pageNum = 1;
        let limitNum = 10;

        if (usePagination) {
            pageNum = parseInt(page || 1);
            limitNum = parseInt(limit || 10);

            if (isNaN(pageNum) || pageNum < 1) {
                throw new AppError("Page must be a positive number", 400);
            }
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                throw new AppError("Limit must be between 1 and 100", 400);
            }
        }

        // If not admin, only show user's own orders
        if (request.user.role !== "admin") {
            filters.userId = request.user._id;
        } else if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new AppError("Invalid userId format", 400);
            }
            filters.userId = mongoose.Types.ObjectId(userId);
        }

        // Apply status filter if provided
        if (status) {
            if (!VALID_ORDER_STATUSES.includes(status)) {
                throw new AppError(
                    `Invalid status. Valid values are: ${VALID_ORDER_STATUSES.join(
                        ", "
                    )}`,
                    400
                );
            }
            filters.status = status;
        }

        // Apply date filters if provided
        Object.assign(filters, parseDateFilters(startDate, endDate));

        if (usePagination) {
            // Get paginated results and total count
            const skip = (pageNum - 1) * limitNum;
            const [orders, totalOrders] = await Promise.all([
                getAllOrdersService(filters, skip, limitNum),
                getAllOrdersService(filters, null, null, true),
            ]);

            // Calculate pagination metadata
            const totalPages = Math.ceil(totalOrders / limitNum);
            const hasNextPage = pageNum < totalPages;
            const hasPrevPage = pageNum > 1;

            response.status(200).json({
                status: "success",
                pagination: {
                    total: totalOrders,
                    page: pageNum,
                    limit: limitNum,
                    totalPages,
                    hasNextPage,
                    hasPrevPage,
                },
                orders,
            });
        } else {
            // Get all orders without pagination
            const orders = await getAllOrdersService(filters);
            response.status(200).json({
                status: "success",
                orders,
            });
        }
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
        if (
            request.user.role !== "admin" &&
            existingOrder.userId.toString() !== request.user._id.toString()
        ) {
            throw new AppError("Not authorized to update this order", 403);
        }

        const updatedOrder = await updateOrderService(orderId, updateData);

        // Create a summary of what changed
        const changes = Object.keys(updateData)
            .map((key) => `${key}: ${updateData[key]}`)
            .join(", ");

        console.log(
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
            "\n📝 Order updated by:",
            request.user?.email || "Unknown user",
            "\nChanges made:",
            changes,
            "\nOrder ID:",
            orderId,
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
        );

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
        const { page = 1, limit = 10 } = request.query;
        const userId = request.user._id;

        // Convert page and limit to numbers and validate
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            throw new AppError("Page must be a positive number", 400);
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            throw new AppError("Limit must be between 1 and 100", 400);
        }

        const filters = { userId: new mongoose.Types.ObjectId(userId) };

        // Get paginated results and total count
        const skip = (pageNum - 1) * limitNum;
        const [orders, totalOrders] = await Promise.all([
            getAllOrdersService(filters, skip, limitNum),
            getAllOrdersService(filters, null, null, true), // Count only
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalOrders / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        response.status(200).json({
            status: "success",
            pagination: {
                total: totalOrders,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
            orders,
        });
    } catch (error) {
        next(error);
    }
};

// Add this new controller function
const getUserOrders = async (request, response, next) => {
    try {
        const { userId } = request.params;

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new AppError("Invalid user ID format", 400);
        }

        // Get orders for specific user
        const orders = await getAllOrdersService({
            userId: new mongoose.Types.ObjectId(userId),
        });

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
    getMyOrders,
    getUserOrders,
};
