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
        
        // Update order with status AND shipping address from Stripe
        await OrderModel.findByIdAndUpdate(orderId, { 
            status: 'payment received',
            shippingAddress: session.shipping?.address ? {
                street: session.shipping.address.line1,
                suburb: session.shipping.address.city,
                postcode: session.shipping.address.postal_code,
                state: session.shipping.address.state,
                country: session.shipping.address.country,
            } : null
        });

        // Also update user's profile with the shipping address
        if (session.shipping?.address) {
            await User.findByIdAndUpdate(session.metadata.userId, {
                'profile.address': session.shipping.address
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