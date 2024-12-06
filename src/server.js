// Import required modules
const express = require("express");
const productRoutes = require("./product/ProductRoutes"); // Import your product routes

// Initialize Express app
const app = express();

// Middleware to parse JSON payloads
app.use(express.json());

// Register product routes under "/products" name
app.use("/products", productRoutes);

// Export the app so that other files can control when the server
// starts and stops
module.exports = {
	app,
};
