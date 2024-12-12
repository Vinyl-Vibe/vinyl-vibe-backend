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

// Public routes - no authentication required
// These endpoints create or validate authentication
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// Social Login Routes
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

// Apple Sign In Routes
router.get("/apple", (req, res, next) => {
    if (!passport._strategies.apple) {
        return res.status(503).json({
            status: 'error',
            message: 'Apple Sign In is not configured'
        });
    }
    passport.authenticate("apple")(req, res, next);
});

router.post("/apple/callback", function (req, res, next) {
    if (!passport._strategies.apple) {
        return res.status(503).json({
            status: 'error',
            message: 'Apple Sign In is not configured'
        });
    }
    // Debug incoming request
    console.log('Apple Callback Request:', {
        body: req.body,
        method: req.method,
        headers: req.headers
    });

    passport.authenticate(
        "apple",
        {
            failureRedirect: "/auth/error",
        },
        function (err, user, info) {
            // Debug authentication result
            console.log('Apple Auth Result:', {
                hasError: !!err,
                errorType: err?.constructor?.name,
                errorMessage: err?.message,
                hasUser: !!user,
                info
            });

            if (err) {
                if (err === "AuthorizationError") {
                    return res.redirect("/auth/error?reason=authorization");
                } else if (err === "TokenError") {
                    return res.redirect("/auth/error?reason=token");
                }
                // Log the actual error
                console.error('Apple Auth Error:', err);
                return res.redirect("/auth/error?reason=unknown");
            }

            if (!user) {
                console.log('No user returned from Apple auth');
                return res.redirect("/auth/error?reason=no_user");
            }

            // Update user's name if provided (only happens on first sign in)
            if (req.body.user && user.profile) {
                user.profile.firstName = req.body.user.name?.firstName || user.profile.firstName;
                user.profile.lastName = req.body.user.name?.lastName || user.profile.lastName;
                user.save().catch(err => console.error('Error saving user profile:', err));
            }

            // Generate token and redirect
            AuthService.generateToken(user)
                .then((token) => {
                    const frontendUrl =
                        process.env.NODE_ENV === "production"
                            ? "https://vinylvibe.live"
                            : "http://localhost:5173";
                    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
                })
                .catch(next);
        }
    )(req, res, next);
});

// Password reset routes (public)
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 requests per hour
});

router.post(
    "/forgot-password",
    passwordResetLimiter,
    AuthController.forgotPassword
);
router.post("/reset-password", AuthController.resetPassword);

// Protected route - requires valid token
// Why validate refresh token?
// - Prevents unauthorised token refresh
// - Ensures user still exists and has access
router.get("/refresh", validateUserAuth, AuthController.refresh);

// Get current user data
router.get("/me", validateUserAuth, AuthController.getCurrentUser);

module.exports = router;
