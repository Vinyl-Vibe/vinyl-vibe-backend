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

    // Fallback to local MongoDB if no DATABASE_URL provided
    // Why use npm_package_name?
    // - Creates database named after project
    // - Prevents test/dev database collisions
    let databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        databaseUrl = `mongodb://127.0.0.1:27017/${process.env.npm_package_name}`;
    }

    try {
        // Connect with Mongoose
        // Why async/await?
        // - Cleaner error handling
        // - Ensures connection before server starts
        // - Prevents race conditions
        await mongoose.connect(databaseUrl);
        console.log("📀 Successfully connected to MongoDB Atlas!");
    } catch (error) {
        // Log error and rethrow
        // Why rethrow?
        // - Allows calling code to handle connection failure
        // - Prevents server from starting with no database
        console.error("🛑 Failed to connect to MongoDB Atlas:", error);
        throw error;
    }
}

module.exports = {
    dbConnect,
};
