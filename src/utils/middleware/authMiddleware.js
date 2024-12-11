/**
 * Authentication middleware for protecting routes
 *
 * Why separate from jwtMiddleware?
 * - Handles high-level auth logic
 * - Focuses on route protection and user session
 * - Can be extended for different auth strategies
 *
 * Why async middleware?
 * - Allows for future database checks
 * - Better error handling with try/catch
 * - Can be extended with async operations
 */

const { AppError } = require('./errorMiddleware');
const { decodeJWT } = require('./jwtMiddleware');

async function validateUserAuth(request, response, next) {
	try {
		// Get JWT from headers
		// Why use headers instead of body/query?
		// - Industry standard for token transmission
		// - Keeps authentication separate from request data
		// - Allows for consistent token handling across routes
		// let providedToken = request.headers.jwt;
		let providedToken = request.headers.authorization;

		// Early return if no token provided
		// Why 403 instead of 401?
		// - 401: Not authenticated (no credentials)
		// - 403: Authenticated but not authorised
		// - More specific error for client handling
		if (!providedToken) {
			throw new AppError("Sign in to view this content!", 403);
		}

		// Verify and decode the JWT
		// Why check userId specifically?
		// - Ensures token contains required user data
		// - Guards against malformed tokens
		// - Validates token structure matches our requirements
		let decodedData = decodeJWT(providedToken);
		if (!decodedData.userId) {
			throw new AppError("Sign in to view this content!", 403);
		}

		// Pass control to next middleware
		// Why use next() instead of return?
		// - Express middleware chain pattern
		// - Allows for additional middleware after auth
		// - Maintains consistent middleware flow
		next();
	} catch (error) {
		// Pass errors to error handling middleware
		// Why use next(error) instead of direct response?
		// - Centralised error handling
		// - Consistent error format across application
		// - Proper error logging and tracking
		next(error);
	}
}

module.exports = {
	validateUserAuth,
};