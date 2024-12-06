// Import required modules
const express = require("express");
const productRoutes = require("./product/ProductRoutes"); // Import your product routes

// Initialize Express app
const app = express();

// Middleware to parse JSON payloads
app.use(express.json());

// Register product routes under "/products" name
app.use("/products", productRoutes);

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

// Export the app so that other files can control when the server
// starts and stops
module.exports = {
	app,
};
