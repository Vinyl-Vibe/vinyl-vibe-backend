const mongoose = require("mongoose");

/**
 * Database connection handler
 *
 * Why use environment variables for DB connection?
 * - Security: Keep credentials out of code
 * - Flexibility: Different DBs for dev/test/prod
 * - DevOps best practice: Configuration as environment
 */
async function dbConnect() {
    // Log connection string (without credentials in production)
    console.log("Attempting to connect to:", process.env.DATABASE_URL);

    // Fallback to local MongoDB if no DATABASE_URL provided
    // Why use npm_package_name?
    // - Creates database named after project
    // - Prevents test/dev database collisions
	let databaseUrl = process.env.DATABASE_URL;

	try {
		// Connect with Mongoose
        // Why async/await?
        // - Cleaner error handling
        // - Ensures connection before server starts
        // - Prevents race conditions
        await mongoose.connect(databaseUrl);
        console.log("Successfully connected to MongoDB!");
    } catch (error) {
        // Log error and rethrow
        // Why rethrow?
        // - Allows calling code to handle connection failure
        // - Prevents server from starting with no database
        console.error("Database connection error:", error);
        throw error;
    }
}

module.exports = {
    dbConnect,
};
