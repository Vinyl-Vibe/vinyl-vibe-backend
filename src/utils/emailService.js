const { Resend } = require("resend");
const { AppError } = require("./middleware/errorMiddleware");

/**
 * Email service using Resend
 *
 * Why use Resend?
 * - Modern API design
 * - High deliverability
 * - Built-in analytics
 * - Simple implementation
 */
const resend = new Resend(process.env.RESEND_API_KEY);

const EmailService = {
    // Sending a password reset email
    async sendPasswordReset(email, resetToken) {
        const resetLink = `https://vinylvibe.live/reset-password?token=${resetToken}`;

        try {
            await resend.emails.send({
                from: "VinylVibe <noreply@vinylvibe.live>",
                to: email,
                subject: "Reset Your VinylVibe Password",
                html: `
                    <h2>Password Reset Request</h2>
                    <p>You requested to reset your password. Click the link below to proceed:</p>
                    <a href="${resetLink}">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `,
            });
        } catch (error) {
            console.error("Email send error:", error);
            throw new AppError("Failed to send password reset email", 500);
        }
    },

    async sendOrderConfirmation(email, order) {
        try {
            await resend.emails.send({
                from: "VinylVibe <noreply@vinylvibe.live>",
                to: email,
                subject: "Order Confirmation - VinylVibe",
                html: `
                    <h2>Thank you for your order!</h2>
                    <p>Order ID: ${order._id}</p>
                    <p>Total: $${order.total}</p>
                    <p>Status: ${order.status}</p>
                    <p>We'll send you another email once your payment is confirmed.</p>
                `,
            });
        } catch (error) {
            console.error("Email send error:", error);
            throw new AppError("Failed to send order confirmation email", 500);
        }
    },
};

module.exports = EmailService;
