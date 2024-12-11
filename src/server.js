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
const authRoutes = require("./auth/AuthRoutes");
const userRoutes = require("./users/UserRoutes");
const productRoutes = require("./product/ProductRoutes");
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

// Built-in middleware
app.use(express.json()); // Parse JSON request bodies

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
app.use("/products", productRoutes);

// Error handling middleware - must be last
app.use(errorHandler);

module.exports = {
	app,
};
