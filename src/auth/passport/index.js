const passport = require("passport");
const { User } = require("../../users/UserModel");

/**
 * Passport configuration
 *
 * Why use Passport?
 * - Industry standard for OAuth
 * - Supports multiple providers
 * - Handles complex OAuth flows
 * - Extensive middleware ecosystem
 */

// Serialize user for the session
// Why serialize?
// - Convert user object to simple identifier
// - Minimize session storage
// - Improve performance
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from the session
// Why deserialize?
// - Convert identifier back to user object
// - Fetch fresh user data
// - Ensure up-to-date user info
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => done(null, user))
        .catch(err => done(err));
});

// Import strategies
require("./googleStrategy");

module.exports = passport;
