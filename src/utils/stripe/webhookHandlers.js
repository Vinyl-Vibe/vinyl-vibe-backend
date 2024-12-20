const { OrderModel } = require("../../orders/OrderModel");
const { User } = require("../../users/UserModel");
const { CartModel } = require("../../cart/CartModel");
const EmailService = require("../emailService");
const { AppError } = require("../middleware/errorMiddleware");

/**
 * Handles successful checkout completion
 * - Updates order status
 * - Sends confirmation email
 * - Returns true if successful
 */
const handleCheckoutComplete = async (session) => {
    try {
        console.log("Starting checkout completion process with session:", {
            id: session.id,
            orderId: session.metadata?.orderId,
            userId: session.metadata?.userId,
            hasShipping: !!session.shipping,
        });

        if (!session.metadata?.orderId || !session.metadata?.userId) {
            throw new Error("Missing required metadata: orderId or userId");
        }

        const orderId = session.metadata.orderId;
        const userId = session.metadata.userId;

        // Log shipping address if present
        if (session.shipping?.address) {
            console.log("Shipping address received:", session.shipping.address);
        }

        // Update order status and shipping address
        const updatedOrder = await OrderModel.findByIdAndUpdate(
            orderId,
            {
                status: "payment received",
                shippingAddress: session.shipping?.address
                    ? {
                          street: session.shipping.address.line1,
                          suburb: session.shipping.address.city,
                          postcode: session.shipping.address.postal_code,
                          state: session.shipping.address.state,
                          country: session.shipping.address.country,
                      }
                    : null,
            },
            { new: true }
        );

        console.log("Order updated:", updatedOrder ? "Success" : "Failed");

        // Update user's profile with shipping address
        if (session.shipping?.address) {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    "profile.address": {
                        street: session.shipping.address.line1,
                        city: session.shipping.address.city,
                        postcode: session.shipping.address.postal_code,
                        state: session.shipping.address.state,
                        country: session.shipping.address.country,
                    },
                },
                { new: true }
            );
            console.log(
                "User profile updated:",
                updatedUser ? "Success" : "Failed"
            );
        }

        // Clear the user's cart
        const clearedCart = await CartModel.findOneAndDelete({ userId });
        console.log("Cart cleared:", clearedCart ? "Success" : "Failed");

        // Send confirmation email
        const populatedOrder = await OrderModel.findById(orderId)
            .populate("userId", "email")
            .populate("products.productId", "name price");

        if (!populatedOrder) {
            throw new AppError("Order not found after update", 404);
        }

        await EmailService.sendOrderConfirmation(
            populatedOrder.userId.email,
            populatedOrder
        );
        console.log("Confirmation email sent to:", populatedOrder.userId.email);

        return true;
    } catch (error) {
        console.error("Detailed error in handleCheckoutComplete:", {
            message: error.message,
            stack: error.stack,
            code: error.code,
        });
        throw error;
    }
};

// Export all webhook handlers
module.exports = {
    handleCheckoutComplete,
};
