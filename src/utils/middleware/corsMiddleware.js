const cors = require("cors");

/**
 * CORS (Cross-Origin Resource Sharing) configuration
 *
 * Why use CORS?
 * - Security: Prevents unauthorised domains from accessing API
 * - Browser requirement: Modern browsers enforce CORS
 * - Flexible: Can allow specific domains per environment
 */

const corsOptions = {
    // Whitelist of allowed origins
    // Why array instead of single origin?
    // - Support multiple environments
    // - Allow both local development and production
    origin: [
        "http://localhost:8080", // CRA local development
        "http://localhost:5173", // Vite local development
        "https://vinylvibe.live", // Production front-end
    ],

    // Success status configuration
    // Why 200 instead of 204?
    // - Better compatibility with older browsers
    // - Consistent response across all clients
    // - Avoids issues with empty responses
    optionsSuccessStatus: 200,
};

// Create middleware using cors package
// Why use middleware approach?
// - Consistent CORS handling across all routes
// - Centralised configuration
// - Easy to modify allowed origins
const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
