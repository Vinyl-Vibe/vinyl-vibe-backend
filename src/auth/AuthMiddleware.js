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
const crypto = require("crypto");
const { User } = require("../users/UserModel");

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
 *
 * Why use _id instead of userId?
 * - Consistent with MongoDB's _id field
 * - Used throughout the application
 * - Prevents confusion between different ID formats
 */
function generateJWT(userId, email, role) {
    return jwt.sign(
        {
            _id: userId,
            userId: userId,
            email,
            role,
            isAdmin: role === "admin",
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

        const decoded = jwt.verify(token, JWT_SECRET);

        // Debug log to see what's in the token
        console.log("Decoded token contents:", decoded);

        request.user = decoded;

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            next(new AppError("Invalid token", 401));
        } else if (error.name === "TokenExpiredError") {
            next(new AppError("Token has expired", 401));
        } else {
            next(error);
        }
    }
}

const validateResetToken = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            throw new AppError("Reset token is required", 400);
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            throw new AppError("Invalid or expired reset token", 401);
        }

        // Attach user to request for next middleware
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

const validateNewPassword = (req, res, next) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return next(
            new AppError("Password must be at least 8 characters", 400)
        );
    }

    // Add more password requirements as needed
    next();
};

module.exports = {
    generateJWT,
    validateUserAuth,
    validateResetToken,
    validateNewPassword,
};
