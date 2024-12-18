const { OrderModel } = require("./OrderModel");
const { AppError } = require("../utils/middleware/errorMiddleware");

// Constants for order validation
const VALID_ORDER_STATUSES = ['pending', 'completed', 'canceled', 'shipped', 'delivered', 'returned'];

// Validation helpers
const validateOrderData = (orderData) => {
    const { products, total, status, shippingAddress } = orderData;

    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
        throw new AppError('Order must include at least one product', 400);
    }

    // Validate each product
    products.forEach(product => {
        if (!product.productId || typeof product.quantity !== 'number' || product.quantity < 1) {
            throw new AppError('Each product must have a valid productId and quantity', 400);
        }
    });

    // Validate total
    if (typeof total !== 'number' || total <= 0) {
        throw new AppError('Total must be a positive number', 400);
    }

    // Validate status
    if (!VALID_ORDER_STATUSES.includes(status?.toLowerCase())) {
        throw new AppError(`Invalid status. Valid statuses are: ${VALID_ORDER_STATUSES.join(', ')}`, 400);
    }

    // Validate shipping address
    const requiredAddressFields = ['street', 'suburb', 'postcode', 'state', 'country'];
    if (!shippingAddress || !requiredAddressFields.every(field => shippingAddress[field])) {
        throw new AppError('Shipping address must include street, suburb, postcode, state, and country', 400);
    }
};

// Service for creating a new order
const createOrder = async (orderData) => {
    // Validate order data before creating
    validateOrderData(orderData);
    
    const newOrder = new OrderModel(orderData);
    await newOrder.save();
    return newOrder;
};

// Service for getting a specific order by ID
const getOrder = async (orderId) => {
    const order = await OrderModel.findById(orderId)
        .populate("userId", "name email")
        .populate("products.productId", "name price");
    return order;
};

// Service for getting all orders with optional filters
const getAllOrders = async (filters = {}) => {
    try {
        const orders = await OrderModel.find(filters)
            .populate("userId", "name email")
            .populate("products.productId", "name price");
        
        return orders;
    } catch (error) {
        throw new AppError("Unable to fetch orders", 500);
    }
};

// Combined service for updating orders (both full and partial updates)
const updateOrder = async (orderId, updateData) => {
    try {
        // If status is being updated, validate it
        if (updateData.status) {
            if (!VALID_ORDER_STATUSES.includes(updateData.status.toLowerCase())) {
                throw new AppError(`Invalid status. Valid statuses are: ${VALID_ORDER_STATUSES.join(', ')}`, 400);
            }
            updateData.status = updateData.status.toLowerCase();
        }

        // Validate the update data if it's a full update
        if (updateData.products || updateData.total || updateData.shippingAddress) {
            validateOrderData(updateData);
        }

        const updatedOrder = await OrderModel.findByIdAndUpdate(
            orderId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("userId", "name email")
         .populate("products.productId", "name price");

        if (!updatedOrder) {
            throw new AppError("Order not found", 404);
        }

        return updatedOrder;
    } catch (error) {
        throw error;
    }
};

// Service for deleting (canceling) an order by ID
const deleteOrder = async (orderId) => {
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);
    return deletedOrder;
};

// Helper function to get orders for a specific user
const getOrdersByUserId = async (userId) => {
    try {
        const orders = await OrderModel.find({ userId })
            .populate("userId", "name email")
            .populate("products.productId", "name price");
        
        return orders;
    } catch (error) {
        throw new AppError("Unable to fetch user orders", 500);
    }
};

module.exports = {
    createOrder,
    getOrder,
    getAllOrders,
    updateOrder,
    deleteOrder,
    VALID_ORDER_STATUSES,
    getOrdersByUserId
};
