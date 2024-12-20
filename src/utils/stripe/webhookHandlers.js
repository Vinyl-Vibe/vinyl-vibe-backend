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
        if (!session.metadata?.orderId || !session.metadata?.userId) {
            throw new Error("Missing required metadata: orderId or userId");
        }

        const orderId = session.metadata.orderId;
        const userId = session.metadata.userId;

        // Update order status and shipping address
        const existingOrder = await OrderModel.findById(orderId).populate(
            "userId",
            "email"
        );

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

        console.log(
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
            "\n📝 Order updated by Stripe webhook.",
            "\nOrder status changed for user:",
            existingOrder.userId?.email || "Unknown user",
            "\nOrder ID:",
            orderId,
            "\nFrom:",
            existingOrder.status,
            "\nTo:",
            updatedOrder.status,
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
        );

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

            if (updatedUser) {
                console.log(
                    "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
                    "\n📝 User profile updated by Stripe webhook.",
                    "\nAddress updated for user:",
                    updatedUser.email || "Unknown user",
                    "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
                );
            }
        }

        // Clear the user's cart
        const clearedCart = await CartModel.findOneAndDelete({ userId });

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

        console.log(
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
            "\n✉️ Confirmation email sent to:",
            populatedOrder.userId?.email || "Unknown user",
            "\n Users cart cleared:",
            clearedCart ? "Success" : "Failed",
            "\nOrder ID:",
            orderId,
            "\nOrder total: $",
            populatedOrder.total,
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
        );

        return true;
    } catch (error) {
        console.error(
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
            "\n❌ Error in handleCheckoutComplete:",
            "\nMessage:",
            error.message,
            "\nStack:",
            error.stack,
            "\nCode:",
            error.code,
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
        );
        throw error;
    }
};

// Export all webhook handlers
module.exports = {
    handleCheckoutComplete,
};
