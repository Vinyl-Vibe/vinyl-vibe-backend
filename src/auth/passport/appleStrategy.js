const passport = require('passport');
const AppleStrategy = require('passport-apple');
const { User } = require('../../users/UserModel');

passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamId: process.env.APPLE_TEAM_ID,  // Note: lowercase 'd'
    callbackURL: process.env.APPLE_CALLBACK_URL,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyString: process.env.APPLE_PRIVATE_KEY
}, function(req, accessToken, refreshToken, idToken, profile, cb) {
    // Log the token info for debugging
    console.log('Apple auth callback:', {
        hasIdToken: !!idToken,
        hasUserData: !!req.body?.user
    });

    if (req.body && req.body.user) {
        console.log('User data from Apple:', req.body.user);
    }
    
    cb(null, idToken);
}));
