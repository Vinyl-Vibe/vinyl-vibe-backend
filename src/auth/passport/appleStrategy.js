const passport = require("passport");
const AppleStrategy = require("passport-apple");
const { User } = require("../../users/UserModel");
const path = require('path');

/**
 * Apple Sign In Strategy
 *
 * Why different from Google?
 * - Apple requires private key
 * - Email might be private relay
 * - Name only provided on first login
 */

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_CALLBACK_URL = process.env.APPLE_CALLBACK_URL;
const PRIVATE_KEY_PATH = '/etc/secrets/apple-private-key.p8';

// Debug environment variables
console.log('Apple Auth Config:', {
    hasClientId: !!APPLE_CLIENT_ID,
    hasTeamId: !!APPLE_TEAM_ID,
    hasKeyId: !!APPLE_KEY_ID,
    hasCallbackUrl: !!APPLE_CALLBACK_URL,
    privateKeyPath: PRIVATE_KEY_PATH
});

// Only initialize Apple strategy if all required credentials are present
if (APPLE_CLIENT_ID && APPLE_TEAM_ID && APPLE_KEY_ID) {
    passport.use(
        new AppleStrategy(
            {
                clientID: APPLE_CLIENT_ID,
                teamID: APPLE_TEAM_ID,
                keyID: APPLE_KEY_ID,
                privateKeyLocation: PRIVATE_KEY_PATH,
                callbackURL: APPLE_CALLBACK_URL,
                passReqToCallback: true
            },
            function(req, accessToken, refreshToken, idToken, profile, cb) {
                console.log('Apple callback received:', {
                    hasAccessToken: !!accessToken,
                    hasIdToken: !!idToken,
                    hasProfile: !!profile,
                    body: req.body,
                    idTokenContent: idToken ? JSON.stringify(idToken) : 'No ID Token'
                });

                // The idToken is encoded - need to access properties safely
                if (!idToken || !idToken.sub) {
                    console.error('Invalid ID Token:', idToken);
                    return cb(new Error('Invalid Apple ID token'));
                }

                const email = idToken.email;
                const providerId = idToken.sub;

                if (!email) {
                    return cb(new Error('No email provided from Apple'));
                }

                // Check if user exists with Apple ID
                User.findOne({
                    "socialLogins.provider": "apple",
                    "socialLogins.providerId": providerId,
                }).then(user => {
                    if (user) {
                        // Add Apple login to existing user
                        if (!user.profile.firstName && req.body?.user?.name?.firstName) {
                            user.profile.firstName = req.body.user.name.firstName;
                            user.profile.lastName = req.body.user.name.lastName;
                        }
                        // Check if this Apple login already exists
                        const existingLogin = user.socialLogins.find(
                            login => login.provider === 'apple' && login.providerId === providerId
                        );
                        
                        if (!existingLogin) {
                            // Only add if it doesn't exist
                            user.socialLogins.push({
                                provider: "apple",
                                providerId: providerId,
                                email
                            });
                        }
                        user.save().then(() => cb(null, user));
                        return;
                    }

                    // Check if user exists with same email
                    User.findOne({ email }).then(user => {
                        if (user) {
                            // Add Apple login to existing user
                            user.socialLogins.push({
                                provider: "apple",
                                providerId: providerId,
                                email,
                            });
                            user.save().then(() => cb(null, user));
                            return;
                        }
                        
                        // Create new user
                        User.create({
                            email,
                            profile: {
                                firstName: req.body?.user?.name?.firstName || '',
                                lastName: req.body?.user?.name?.lastName || '',
                            },
                            socialLogins: [{
                                provider: "apple",
                                providerId: providerId,
                                email,
                            }],
                        }).then(newUser => cb(null, newUser))
                          .catch(err => cb(err));
                    }).catch(err => cb(err));
                }).catch(err => cb(err));
            }
        )
    );
} else {
    console.warn('Apple Sign In credentials missing - Apple authentication will be unavailable');
}
