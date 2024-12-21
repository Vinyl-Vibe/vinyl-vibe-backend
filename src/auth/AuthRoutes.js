const express = require("express");
const router = express.Router();
const AuthController = require("./AuthController");
const { validateUserAuth } = require("./AuthMiddleware");
const passport = require("./passport");

/**
 * Auth routes handle user authentication flows
 *
 * Why separate auth routes?
 * - Keeps authentication logic isolated
 * - Makes it easier to apply different middleware to auth vs protected routes
 * - Clearer API structure for front-end developers
 */

// Google OAuth Routes - These must come BEFORE validateUserAuth middleware
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

// Protected routes - Add validateUserAuth middleware after OAuth routes
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", validateUserAuth, AuthController.logout);
router.get("/refresh", validateUserAuth, AuthController.refresh);
router.get("/me", validateUserAuth, AuthController.getCurrentUser);

// Password reset routes
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

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
