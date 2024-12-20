const { stripe } = require('./index');
const { handleCheckoutComplete } = require('./webhookHandlers');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Main webhook handler that routes different webhook events
 * to their specific handlers
 * 
 * Why use raw body?
 * - Stripe requires the raw request body to verify webhook signatures
 * - This prevents webhook spoofing and ensures security
 */
const handleWebhook = async (req, res) => {
    // Get the raw body as a buffer
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    
    try {
        // Verify webhook signature with raw payload
        const event = stripe.webhooks.constructEvent(
            payload,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Log the event for debugging
        console.log('Webhook received:', {
            type: event.type,
            id: event.id
        });

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                console.log('Processing checkout completion...');
                await handleCheckoutComplete(event.data.object);
                console.log('Checkout completion processed successfully');
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

module.exports = {
    handleWebhook
}; 