const passport = require("passport");
const AppleStrategy = require("passport-apple");
const { User } = require("../../users/UserModel");

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
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
const APPLE_CALLBACK_URL = process.env.APPLE_CALLBACK_URL;

if (!APPLE_CLIENT_ID || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) {
    throw new Error("Apple Sign In credentials missing");
}

passport.use(
    new AppleStrategy(
        {
            clientID: APPLE_CLIENT_ID,
            teamID: APPLE_TEAM_ID,
            keyID: APPLE_KEY_ID,
            privateKeyString: APPLE_PRIVATE_KEY,
            callbackURL: APPLE_CALLBACK_URL,
            proxy: true,
            scope: "name email",
            responseMode: "form_post",
            responseType: "code",
            passReqToCallback: true,
            authorizationURL: 'https://appleid.apple.com/auth/authorize',
            tokenURL: 'https://appleid.apple.com/auth/token',
            verifyURL: 'https://appleid.apple.com/auth/keys'
        },
        async (req, accessToken, refreshToken, idToken, profile, done) => {
            try {
                // Apple only provides email and name on first login
                const email = idToken.email;

                // Check if user exists with Apple ID
                let user = await User.findOne({
                    "socialLogins.provider": "apple",
                    "socialLogins.providerId": idToken.sub,
                });

                if (user) {
                    // Add Apple login to existing user
                    if (!user.profile.firstName && req.body?.user?.name?.firstName) {
                        user.profile.firstName = req.body.user.name.firstName;
                        user.profile.lastName = req.body.user.name.lastName;
                    }
                    // Check if this Apple login already exists
                    const existingLogin = user.socialLogins.find(
                        login => login.provider === 'apple' && login.providerId === idToken.sub
                    );
                    
                    if (!existingLogin) {
                        // Only add if it doesn't exist
                        user.socialLogins.push({
                            provider: "apple",
                            providerId: idToken.sub,
                            email
                        });
                    }
                    await user.save();
                    return done(null, user);
                }

                // Check if user exists with same email
                user = await User.findOne({ email });

                if (user) {
                    // Add Apple login to existing user
                    user.socialLogins.push({
                        provider: "apple",
                        providerId: idToken.sub,
                        email,
                    });
                    await user.save();
                    return done(null, user);
                }

                // Create new user
                const newUser = await User.create({
                    email,
                    profile: {
                        // Apple provides name in the initial authorization request
                        firstName: req.body?.user?.name?.firstName || '',
                        lastName: req.body?.user?.name?.lastName || '',
                    },
                    socialLogins: [
                        {
                            provider: "apple",
                            providerId: idToken.sub,
                            email,
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
