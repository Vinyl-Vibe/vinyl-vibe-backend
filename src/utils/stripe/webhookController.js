const { stripe } = require("./index");
const { handleCheckoutComplete } = require("./webhookHandlers");
const { AppError } = require("../middleware/errorMiddleware");

/**
 * Main webhook handler that routes different webhook events
 * to their specific handlers
 *
 * Why use raw body?
 * - Stripe requires the raw request body to verify webhook signatures
 * - This prevents webhook spoofing and ensures security
 */
const handleWebhook = async (req, res) => {
    const payload = req.body;
    const sig = req.headers["stripe-signature"];

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
        }

        // Verify webhook signature with raw payload
        const event = stripe.webhooks.constructEvent(
            payload,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle different event types
        switch (event.type) {
            case "checkout.session.completed":
                await handleCheckoutComplete(event.data.object);
                break;
            default:
        }

        res.json({ received: true });
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

module.exports = {
    handleWebhook,
};
