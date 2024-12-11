const jwt = require("jsonwebtoken");
const { AppError } = require("./errorMiddleware");

/**
 * JWT (JSON Web Token) handling middleware
 *
 * Why use JWTs?
 * - Stateless authentication
 * - Self-contained user data
 * - Industry standard for web APIs
 */

// Get secret key from environment
// Why throw error if missing?
// - Security: Prevent running without proper configuration
// - Fail fast principle: Catch config issues early
const jwtSecretKey = process.env.JWT_SECRET;

if (!jwtSecretKey) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}

/**
 * Generate a new JWT
 *
 * Why include roles?
 * - Role-based access control
 * - Avoid database look ups for basic permissions
 * - Stateless authorization checks
 */
function generateJWT(userId, username, roles = null) {
    return jwt.sign(
        {
            userId,
            username,
            roles,
        },
        jwtSecretKey,
        { expiresIn: "7d" }
    );
}

/**
 * Decode and verify a JWT
 *
 * Why combine verify and decode?
 * - Security: Ensure token is valid before using
 * - Prevents use of expired/tampered tokens
 * - Single function for both operations
 */
function decodeJWT(tokenToDecode) {
    try {
        return jwt.verify(tokenToDecode, jwtSecretKey);
    } catch (err) {
        throw new AppError("Invalid or expired token", 401);
    }
}

/**
 * Middleware to validate JWTs in requests
 *
 * Why use Bearer scheme?
 * - Industry standard format
 * - Clear indication of token type
 * - Supports multiple auth schemes
 */
function validateJWT(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Authentication token missing or invalid", 401);
        }

        const token = authHeader.split(" ")[1];
        const decoded = decodeJWT(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    generateJWT,
    decodeJWT,
    validateJWT,
};