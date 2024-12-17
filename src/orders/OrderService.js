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
    console.log("Filters being used:", filters);  // Debug log to ensure filters are applied correctly
    try {
        // Use the filters object to query the database
        const orders = await OrderModel.find(filters)  // Apply the filters to the database query
            .populate("userId", "name email")  // Optionally populate user details (name and email)
            .populate("products.productId", "name price");  // Populate product details (name and price)
        
        return orders;  // Return the orders based on the filters
    } catch (error) {
        throw new Error("Unable to fetch orders");
    }
};

// Service for updating an order by ID
const updateOrder = async (orderId, updatedData) => {
    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, updatedData, { new: true })
        .populate("userId", "name email")
        .populate("products.productId", "name price");
    return updatedOrder;
};

const partialUpdateOrder = async (orderId, updateFields) => {
    try {
        // Use Mongoose's `findByIdAndUpdate` for partial updates
        const updatedOrder = await OrderModel.findByIdAndUpdate(
            orderId,
            { $set: updateFields }, // Only update the fields provided
            { new: true, runValidators: true } // Return the updated document and apply validators
        );
        return updatedOrder;
    } catch (error) {
        throw error; // Let the controller handle the error
    }
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
    partialUpdateOrder,
    deleteOrder,
};
