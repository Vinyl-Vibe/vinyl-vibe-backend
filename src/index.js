// Purpose:
// First point of entry
// Initiate the server
// Get the port
// Tell the server to listen to web traffic

require("dotenv").config();

const { app } = require("./server.js");
const { dbConnect } = require("./utils/database.js");

/**
 * Server startup sequence
 *
 * Why this order?
 * 1. Load environment variables first - needed for all config
 * 2. Import configured app - avoid circular dependencies
 * 3. Connect to database before listening - ensure DB is ready
 * 4. Start listening only after all setup is complete
 */

// Get the PORT value from environment variables
// Why use environment variable?
// - Different ports for different environments
// - Hosting platforms often assign their own port
// - Avoid port conflicts in development
const PORT = process.env.PORT || 8080;

// Start server and connect to database
// Why async IIFE?
// - Ensures database connection before accepting requests
// - Proper error handling during startup
// - Clean shutdown if startup fails
app.listen(PORT, async () => {
	try {
		await dbConnect();
		console.log("Server is running on port " + PORT);
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1); // Exit with error code
	}
});
