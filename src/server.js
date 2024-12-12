// Purpose:
// Configure the server, eg.
// - routes
// - middleware
// - CORS
// - debug logger setups
// - connections to databases
// - connections to file storage

const express = require("express");
const corsMiddleware = require("./utils/middleware/corsMiddleware");
const passport = require("./auth/passport");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const authRoutes = require("./auth/AuthRoutes");
const userRoutes = require("./users/UserRoutes");
const cartRoutes = require("./cart/CartRoutes");
const productRoutes = require("./products/ProductRoutes");
const { errorHandler } = require("./utils/middleware/errorMiddleware");

/**
 * Main Express application setup
 *
 * Why separate server config from index.js?
 * - Separation of concerns: server config vs server startup
 * - Makes testing easier (can import app without starting server)
 * - Cleaner dependency injection
 */
const app = express();

// Trust proxy - needed for secure callback URLs
app.set('trust proxy', true);

// Built-in middleware
app.use(express.json()); // Parse JSON request bodies

// Add body-parser middleware specifically for Apple Sign In callback
app.use('/auth/apple/callback', bodyParser.urlencoded({ extended: false }));

/**
 * Session configuration for Passport
 * Why use MongoStore?
 * - Persists sessions across server restarts
 * - Scales across multiple processes
 * - Better for production use than MemoryStore
 */
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE_URL,
        ttl: 24 * 60 * 60, // Session TTL in seconds (1 day)
        autoRemove: 'native' // Use MongoDB's TTL index
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware for session
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log('Session:', {
            id: req.sessionID,
            hasSession: !!req.session,
            hasPassport: !!req.session?.passport
        });
        next();
    });
}

/**
 * Middleware order matters!
 * Why this order?
 * 1. CORS first - Must send CORS headers before any errors
 * 2. Body parsing - Need request body for most routes
 * 3. Routes - Process the actual request
 * 4. Error handling - Must be last to catch all errors
 */
app.use(corsMiddleware);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/cart", cartRoutes);
app.use("/products", productRoutes);

// Error handling middleware - must be last
app.use(errorHandler);

module.exports = {
    app,
};
