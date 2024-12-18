const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Initialize Stripe with the secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to create a Stripe Checkout Session
const createCheckoutSession = async (orderData) => {
    try {
        // Convert order items to Stripe line items format
        const lineItems = orderData.products.map(item => ({
            price_data: {
                currency: 'aud',
                product_data: {
                    name: item.productId.name,
                    description: item.productId.description,
                },
                unit_amount: Math.round(item.productId.price * 100),
            },
            quantity: item.quantity,
        }));

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cart`,
            metadata: {
                orderId: orderData._id.toString(),
            },
        });

        return session;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
};

module.exports = {
    stripe,
    createCheckoutSession
}; 