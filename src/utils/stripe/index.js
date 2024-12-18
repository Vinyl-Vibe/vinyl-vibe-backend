const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Initialize Stripe with the secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to create a Stripe Checkout Session
const createCheckoutSession = async (orderData) => {
    try {
        const lineItems = orderData.products.map(item => {
            // Base product data
            const productData = {
                name: item.productId.name,
                description: item.productId.description,
            };

            // Only add images if thumbnail exists
            if (item.productId.thumbnail) {
                productData.images = [item.productId.thumbnail];
            }

            return {
                price_data: {
                    currency: 'aud',
                    product_data: productData,
                    unit_amount: Math.round(item.productId.price * 100),
                },
                quantity: item.quantity,
            };
        });

        const sessionConfig = {
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/`,
            customer_email: orderData.userId.email,
            shipping_address_collection: {
                allowed_countries: ['AU'],
            },
            metadata: {
                orderId: orderData._id.toString(),
                userId: orderData.userId._id.toString(),
            },
        };

        const session = await stripe.checkout.sessions.create(sessionConfig);
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