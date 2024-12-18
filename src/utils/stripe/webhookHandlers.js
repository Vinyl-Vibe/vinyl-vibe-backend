const { OrderModel } = require('../../orders/OrderModel');
const EmailService = require('../emailService');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Handles successful checkout completion
 * - Updates order status
 * - Sends confirmation email
 * - Returns true if successful
 */
const handleCheckoutComplete = async (session) => {
    try {
        const orderId = session.metadata.orderId;
        
        // Update order status to completed
        await OrderModel.findByIdAndUpdate(orderId, { status: 'completed' });
        
        // Get order details and send confirmation
        const order = await OrderModel.findById(orderId)
            .populate('userId', 'email');
            
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        await EmailService.sendOrderConfirmation(order.userId.email, order);
        return true;
    } catch (error) {
        console.error('Error handling checkout completion:', error);
        throw error;
    }
};

// Export all webhook handlers
module.exports = {
    handleCheckoutComplete
}; 