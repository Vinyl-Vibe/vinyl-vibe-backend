const { OrderModel } = require("./OrderModel");
const { AppError } = require("../utils/middleware/errorMiddleware");

// Service for creating a new order
const createOrder = async (orderData) => {
    const newOrder = new OrderModel(orderData);
    await newOrder.save();
    return newOrder;
};

// Service for getting a specific order by ID
const getOrder = async (orderId) => {
    const order = await OrderModel.findById(orderId)
        .populate("userId", "name email") // Populate user details (adjust fields as necessary)
        .populate("products.productId", "name price"); // Populate product details
    return order;
};

// Service for getting all orders with optional filters
const getAllOrders = async (filters) => {
    const orders = await OrderModel.find(filters)
        .populate("userId", "name email") // Populate user details
        .populate("products.productId", "name price"); // Populate product details
    return orders;
};

// Service for updating an order by ID
const updateOrder = async (orderId, updatedData) => {
    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, updatedData, { new: true })
        .populate("userId", "name email")
        .populate("products.productId", "name price");
    return updatedOrder;
};

// Service for deleting (canceling) an order by ID
const deleteOrder = async (orderId) => {
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);
    return deletedOrder;
};

module.exports = {
    createOrder,
    getOrder,
    getAllOrders,
    updateOrder,
    deleteOrder,
};
