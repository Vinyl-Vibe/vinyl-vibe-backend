/**
 * Authentication middleware for protecting routes
 *
 * Why in auth folder?
 * - Groups all authentication-related code together
 * - Makes dependencies clearer (auth middleware depends on auth services)
 * - Follows separation of concerns principle
 * - Makes it easier to find and maintain auth-related code
 */

const { AppError } = require("../utils/middleware/errorMiddleware");
const jwt = require("jsonwebtoken");

// Get secret key from environment
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

/**
 * Generate a new JWT
 * Why include roles?
 * - Role-based access control
 * - Avoid database lookups for basic permissions
 * - Stateless authorization checks
 */
function generateJWT(userId, email, role) {
    return jwt.sign(
        {
            userId,
            email,
            role,
            isAdmin: role === 'admin'
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

/**
 * Authentication middleware for protecting routes
 */
async function validateUserAuth(request, response, next) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            throw new AppError("No token provided", 401);
        }

        const token = authHeader.split(" ")[1];
        request.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new AppError("Invalid token", 401));
        } else if (error.name === 'TokenExpiredError') {
            next(new AppError("Token has expired", 401));
        } else {
            next(error);
        }
    }
}

module.exports = {
    generateJWT,
    validateUserAuth
};
