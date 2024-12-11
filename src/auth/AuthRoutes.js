const express = require("express");
const router = express.Router();
const AuthController = require("./AuthController");
const { validateUserAuth } = require("./AuthMiddleware");
const rateLimit = require('express-rate-limit')

/**
 * Auth routes handle user authentication flows
 *
 * Why separate auth routes?
 * - Keeps authentication logic isolated
 * - Makes it easier to apply different middleware to auth vs protected routes
 * - Clearer API structure for front-end developers
 */

// Public routes - no authentication required
// These endpoints create or validate authentication
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// Password reset routes (public)
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3 // limit each IP to 3 requests per hour
})

router.post("/forgot-password", passwordResetLimiter, AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// Protected route - requires valid token
// Why validate refresh token?
// - Prevents unauthorised token refresh
// - Ensures user still exists and has access
router.get("/refresh", validateUserAuth, AuthController.refresh);

module.exports = router;