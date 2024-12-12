const express = require("express");
const router = express.Router();
const AuthController = require("./AuthController");
const { validateUserAuth } = require("./AuthMiddleware");
const rateLimit = require('express-rate-limit')
const passport = require('./passport');

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
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    AuthController.socialLoginCallback
);

// Apple Sign In Routes
router.get('/apple', passport.authenticate('apple'));

router.post('/apple/callback', function(req, res, next) {
    passport.authenticate('apple', function(err, user, info) {
        if (err) {
            if (err === "AuthorizationError") {
                return res.redirect('/auth/error?reason=authorization');
            } else if (err === "TokenError") {
                return res.redirect('/auth/error?reason=token');
            }
            return next(err);
        }
        
        // Generate token and redirect
        AuthService.generateToken(user)
            .then(token => {
                const frontendUrl = process.env.NODE_ENV === 'production'
                    ? 'https://vinylvibe.live'
                    : 'http://localhost:5173';
                res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
            })
            .catch(next);
    })(req, res, next);
});

// Password reset routes (public)
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour 
    max: 10 // limit each IP to 10 requests per hour
})

router.post("/forgot-password", passwordResetLimiter, AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// Protected route - requires valid token
// Why validate refresh token?
// - Prevents unauthorised token refresh
// - Ensures user still exists and has access
router.get("/refresh", validateUserAuth, AuthController.refresh);

// Get current user data
router.get("/me", validateUserAuth, AuthController.getCurrentUser);

module.exports = router;