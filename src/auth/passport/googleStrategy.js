const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../../users/UserModel");
const AuthService = require("../AuthService");

/**
 * Google OAuth2.0 Strategy
 *
 * Why these specific scopes?
 * - profile: Get user's basic info
 * - email: Get verified email address
 * - Minimal permissions for security
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials missing");
}

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: GOOGLE_CALLBACK_URL,
            proxy: true,
            scope: ['profile', 'email'],
            passReqToCallback: true, // Allows us to pass request to callback
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists with this Google ID
                let user = await User.findOne({
                    "socialLogins.provider": "google",
                    "socialLogins.providerId": profile.id,
                });

                if (user) {
                    // Add Google login to existing user
                    // If user doesn't have a name set, use Google's data
                    if (!user.profile.firstName && profile.name.givenName) {
                        user.profile.firstName = profile.name.givenName;
                        user.profile.lastName = profile.name.familyName;
                    }
                    // Check if this Google login already exists
                    const existingLogin = user.socialLogins.find(
                        login => login.provider === 'google' && login.providerId === profile.id
                    );
                    
                    if (!existingLogin) {
                        // Only add if it doesn't exist
                        user.socialLogins.push({
                            provider: "google",
                            providerId: profile.id,
                            email: profile.emails[0].value
                        });
                    }
                    await user.save();
                    return done(null, user);
                }

                // Check if user exists with same email
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // Add Google login to existing user
                    user.socialLogins.push({
                        provider: "google",
                        providerId: profile.id,
                        email: profile.emails[0].value
                    });
                    await user.save();
                    return done(null, user);
                }

                // Create new user
                const newUser = await User.create({
                    email: profile.emails[0].value,
                    profile: {
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                    },
                    socialLogins: [
                        {
                            provider: "google",
                            providerId: profile.id,
                            email: profile.emails[0].value
                        },
                    ],
                });

                done(null, newUser);
            } catch (error) {
                done(error);
            }
        }
    )
);
