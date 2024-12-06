// Import required modules
const express = require("express");
const productRoutes = require("./routes/ProductRoutes"); // Import your product routes

// Initialize Express app
const app = express();

// Middleware to parse JSON payloads
app.use(express.json());

// Register product routes under "/api" name
app.use("/api", productRoutes);

// Export the app so that other files can control when the server
// starts and stops
module.exports = {
  app,
};
