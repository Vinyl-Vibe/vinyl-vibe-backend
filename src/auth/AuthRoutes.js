const express = require("express");
const router = express.Router();
const AuthController = require("./AuthController");
const { validateUserAuth } = require("./AuthMiddleware");
const rateLimit = require("express-rate-limit");
const passport = require("./passport");

/**
 * Auth routes handle user authentication flows
 *
 * Why separate auth routes?
 * - Keeps authentication logic isolated
 * - Makes it easier to apply different middleware to auth vs protected routes
 * - Clearer API structure for front-end developers
 */

// Define rate limiters
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 requests per hour
});

// Public routes - no authentication required
// These endpoints create or validate authentication
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// Password reset routes (public)
router.post(
    "/forgot-password",
    passwordResetLimiter,
    AuthController.forgotPassword
);
router.post("/reset-password", AuthController.resetPassword);

// Google OAuth Routes
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    AuthController.socialLoginCallback
);

// Protected route - requires valid token
router.get("/refresh", validateUserAuth, AuthController.refresh);

// Get current user data
router.get("/me", validateUserAuth, AuthController.getCurrentUser);

// Error handling route
router.get("/error", (req, res) => {
    const reason = req.query.reason || "unknown";
    const errorMessages = {
        authorization: "Authorization failed",
        token: "Token validation failed",
        no_user: "No user found",
        unknown: "An unknown error occurred",
    };

    res.status(400).json({
        status: "error",
        message: errorMessages[reason] || errorMessages.unknown,
    });
});

module.exports = router;
