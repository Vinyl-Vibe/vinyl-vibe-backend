const passport = require("passport");
const AppleStrategy = require("passport-apple");
const { User } = require("../../users/UserModel");
const path = require("path");
const fs = require("fs");

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_CALLBACK_URL = process.env.APPLE_CALLBACK_URL;

// Debug environment variables
console.log("Apple Auth Config:", {
    hasClientId: !!APPLE_CLIENT_ID,
    hasTeamId: !!APPLE_TEAM_ID,
    hasKeyId: !!APPLE_KEY_ID,
    hasCallbackUrl: !!APPLE_CALLBACK_URL,
});

passport.use(
    new AppleStrategy(
        {
            clientID: APPLE_CLIENT_ID,
            teamId: APPLE_TEAM_ID,
            keyID: APPLE_KEY_ID,
            clientSecret:
                "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjU2NkI5QkpKRloifQ.eyJpc3MiOiJRUlIzNTM5Q0o5IiwiaWF0IjoxNzM0MDE5NTY5LCJleHAiOjE3NDE3OTU1NjksImF1ZCI6Imh0dHBzOi8vYXBwbGVpZC5hcHBsZS5jb20iLCJzdWIiOiJsaXZlLnZpbnlsdmliZS5hdXRoIn0.Xma6YjzN--ktdGYCaZ7IUxndYFVobTUTYuQXBrt9ib6Twd19P1TNdTmQ6SvwK7HigzF-1MMVQMzWdKCKmf4gaQ",
            callbackURL: APPLE_CALLBACK_URL,
            passReqToCallback: true,
            scope: ["name", "email"],
            responseMode: "form_post",
            state: false,
            skipUserProfile: true,
            debug: true,
        },
        function (req, accessToken, refreshToken, idToken, profile, cb) {
            try {
                console.log("Apple callback received:", {
                    hasAccessToken: !!accessToken,
                    hasIdToken: !!idToken,
                    hasProfile: !!profile,
                    body: req.body,
                    error: req.query.error,
                    tokenError: req.query.error,
                    code: req.body.code,
                });

                // The idToken is encoded - need to access properties safely
                if (!idToken || !idToken.sub) {
                    console.error("Invalid ID Token:", idToken);
                    return cb(new Error("Invalid Apple ID token"));
                }

                const email = idToken.email;
                const providerId = idToken.sub;

                console.log("Attempting to create/find user with:", {
                    email,
                    providerId,
                    hasUserData: !!req.body.user,
                });

                if (!email) {
                    return cb(new Error("No email provided from Apple"));
                }

                // Check if user exists with Apple ID
                User.findOne({
                    "socialLogins.provider": "apple",
                    "socialLogins.providerId": providerId,
                })
                    .then((user) => {
                        if (user) {
                            // Add Apple login to existing user
                            if (
                                !user.profile.firstName &&
                                req.body?.user?.name?.firstName
                            ) {
                                user.profile.firstName =
                                    req.body.user.name.firstName;
                                user.profile.lastName =
                                    req.body.user.name.lastName;
                            }
                            // Check if this Apple login already exists
                            const existingLogin = user.socialLogins.find(
                                (login) =>
                                    login.provider === "apple" &&
                                    login.providerId === providerId
                            );

                            if (!existingLogin) {
                                // Only add if it doesn't exist
                                user.socialLogins.push({
                                    provider: "apple",
                                    providerId: providerId,
                                    email,
                                });
                            }
                            user.save().then(() => cb(null, user));
                            return;
                        }

                        // Check if user exists with same email
                        User.findOne({ email })
                            .then((user) => {
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
                                        firstName:
                                            req.body?.user?.name?.firstName ||
                                            "",
                                        lastName:
                                            req.body?.user?.name?.lastName ||
                                            "",
                                    },
                                    socialLogins: [
                                        {
                                            provider: "apple",
                                            providerId: providerId,
                                            email,
                                        },
                                    ],
                                })
                                    .then((newUser) => cb(null, newUser))
                                    .catch((err) => cb(err));
                            })
                            .catch((err) => cb(err));
                    })
                    .catch((err) => cb(err));
            } catch (error) {
                cb(error);
            }
        }
    )
);
