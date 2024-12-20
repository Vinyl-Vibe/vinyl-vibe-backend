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

    console.log(
        "Webhook received with signature:",
        sig ? "Present" : "Missing"
    );
    console.log("Headers:", req.headers);
    console.log("Body type:", typeof payload);
    console.log("Body is Buffer:", Buffer.isBuffer(payload));

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

        console.log("Webhook event constructed successfully:", {
            type: event.type,
            id: event.id,
        });

        // Handle different event types
        switch (event.type) {
            case "checkout.session.completed":
                console.log("Processing checkout completion...", {
                    sessionId: event.data.object.id,
                    customerId: event.data.object.customer,
                    metadata: event.data.object.metadata,
                });
                await handleCheckoutComplete(event.data.object);
                console.log("Checkout completion processed successfully");
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error("Webhook Error Details:", {
            error: err.message,
            stack: err.stack,
            sigHeader: sig,
            bodyType: typeof payload,
            isBuffer: Buffer.isBuffer(payload),
        });
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

module.exports = {
    handleWebhook,
};
