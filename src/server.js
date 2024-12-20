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
const MongoStore = require("connect-mongo");
const authRoutes = require("./auth/AuthRoutes");
const userRoutes = require("./users/UserRoutes");
const cartRoutes = require("./cart/CartRoutes");
const productRoutes = require("./products/ProductRoutes");
const orderRoutes = require("./orders/OrderRoutes");
const { errorHandler } = require("./utils/middleware/errorMiddleware");
const { handleWebhook } = require("./utils/stripe/webhookController");

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
app.set("trust proxy", true);

// IMPORTANT: Handle Stripe webhook route BEFORE body parsing middleware
app.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// CORS should be before other middleware but after webhook
app.use(corsMiddleware);

// Regular middleware for other routes
app.use(express.json()); // Parse JSON request bodies for all other routes

/**
 * Session configuration with MongoStore
 * Why MongoStore?
 * - Persists sessions across server restarts
 * - Scales across multiple processes
 * - Better for production than MemoryStore
 */
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({
            mongoUrl: process.env.DATABASE_URL,
            ttl: 24 * 60 * 60, // Session TTL (1 day)
            autoRemove: "native", // Use MongoDB's TTL index
        }),
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/carts", cartRoutes);
app.use("/orders", orderRoutes);

// Error handling last
app.use(errorHandler);

module.exports = {
    app,
};
