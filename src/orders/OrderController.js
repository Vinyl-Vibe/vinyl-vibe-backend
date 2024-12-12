const OrderService = require("./OrderService")

const { 
    createOrder, 
    getOrder, 
    getAllOrders, 
    updateOrder, 
    deleteOrder 
} = require("./OrderService");

// Controller for creating a new order
const createOrder = async (req, res) => {
    try {
        const orderData = req.body; // Get order data from request body
        const newOrder = await createOrder(orderData); // Create the order using the service

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: newOrder,
        });
    } catch (err) {
        console.error("Error in createOrder:", err);
        res.status(500).json({
            success: false,
            message: "Server error, unable to create order",
        });
    }
};


// Controller for getting a specific order by ID
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params; // Get the order ID from URL params
        const order = await getOrder(orderId); // Fetch order using service

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (err) {
        console.error("Error in getOrderById:", err);
        res.status(500).json({
            success: false,
            message: "Server error, unable to fetch order",
        });
    }
};


// Controller for getting all orders with optional filtering
const getAllOrders = async (req, res) => {
    try {
        const { status, userId, startDate, endDate } = req.query; // Extract query params

        // Filters object to be passed to the service layer
        const filters = {};
        if (status) filters.status = status;
        if (userId) filters.userId = userId;
        if (startDate && endDate) {
            filters.createdAt = {
                $gte: new Date(startDate), // Start date filter
                $lte: new Date(endDate),   // End date filter
            };
        }

        const orders = await getAllOrders(filters); // Fetch filtered orders

        res.status(200).json({
            success: true,
            orders,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error, unable to fetch orders",
        });
    }
};

// Controller for updating an order by ID
const updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params; // Get the order ID from URL params
        const updatedData = req.body; // Get the updated order data from the request body
        const updatedOrder = await updateOrder(orderId, updatedData); // Update order

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Order updated successfully",
            order: updatedOrder,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error, unable to update order",
        });
    }
};

// Controller for deleting an order (canceling) by ID
const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params; // Get the order ID from URL params
        const deletedOrder = await deleteOrder(orderId); // Delete order

        if (!deletedOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Order deleted successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error, unable to delete order",
        });
    }
};

module.exports = {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    deleteOrder,
};
