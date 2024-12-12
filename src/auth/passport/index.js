const passport = require('passport');

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

require('./appleStrategy');

module.exports = passport;
