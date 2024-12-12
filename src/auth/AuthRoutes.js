const express = require("express");
const router = express.Router();
const AuthController = require("./AuthController");
const AuthService = require("./AuthService");
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
    console.log('Apple Callback Debug:', {
        session: !!req.session,
        sessionID: req.sessionID,
        body: req.body,
        cookies: req.headers.cookie
    });

    if (!passport._strategies.apple) {
        return res.status(503).json({
            status: 'error',
            message: 'Apple Sign In is not configured'
        });
    }
    // Log any error query parameters from Apple
    if (req.query.error) {
        console.error('Apple auth error:', req.query.error);
    }

    passport.authenticate(
        "apple",
        {
            failureRedirect: "/auth/error",
            failureMessage: true
        },
        function (err, user, info) {
            // Enhanced error logging
            if (err) {
                console.error('Detailed Apple Auth Error:', {
                    name: err.name,
                    message: err.message,
                    code: err.code,
                    status: err.status,
                    stack: err.stack,
                    oauthError: err.oauthError
                });
            }

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

            // Generate JWT token and redirect to frontend
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

// Error handling route
router.get('/error', (req, res) => {
    const reason = req.query.reason || 'unknown';
    const errorMessages = {
        authorization: 'Authorization failed',
        token: 'Token validation failed',
        no_user: 'No user found',
        unknown: 'An unknown error occurred'
    };

    res.status(400).json({
        status: 'error',
        message: errorMessages[reason] || errorMessages.unknown
    });
});

module.exports = router;
