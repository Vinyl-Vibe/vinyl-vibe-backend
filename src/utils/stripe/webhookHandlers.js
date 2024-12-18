const { OrderModel } = require('../../orders/OrderModel');
const { User } = require('../../users/UserModel');
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
        const userId = session.metadata.userId;
        
        // Get shipping address from Stripe
        const shippingAddress = session.shipping?.address ? {
            street: session.shipping.address.line1,
            suburb: session.shipping.address.city,
            postcode: session.shipping.address.postal_code,
            state: session.shipping.address.state,
            country: session.shipping.address.country,
        } : null;

        // Update order status and add shipping address
        await OrderModel.findByIdAndUpdate(orderId, { 
            status: 'completed',
            shippingAddress, // Add shipping address to order
        });

        // If we got a shipping address, update user's profile
        if (shippingAddress) {
            await User.findByIdAndUpdate(userId, {
                'profile.address': shippingAddress
            });
        }

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