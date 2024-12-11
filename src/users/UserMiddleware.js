const jwt = require("jsonwebtoken");

/**
 * Authentication middleware for protecting routes
 * 
 * Why middleware?
 * - Centralises authentication logic
 * - DRY principle: Don't repeat authentication checks
 * - Separates auth verification from business logic
 * - Can be easily added/removed from routes
 */

const validateUserAuth = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		// Check for Bearer token in Authorization header
		// Why use Bearer scheme?
		// - Industry standard for JWT
		// - Clearly indicates token type
		// - Allows for other auth schemes in future
		if (!authHeader?.startsWith("Bearer ")) {
			return res.status(401).json({ error: "No token provided" });
		}

		// Extract token from "Bearer <token>"
		const token = authHeader.split(" ")[1];

		// Verify token and attach user data to request
		// Why attach to request?
		// - Makes user data available to downstream middleware/routes
		// - Prevents need to decode token multiple times
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;

		// Continue to next middleware/route handler
		next();
	} catch (error) {
		// 401 status for authentication failures
		res.status(401).json({ error: "Invalid token" });
	}
};

module.exports = {
	validateUserAuth,
};