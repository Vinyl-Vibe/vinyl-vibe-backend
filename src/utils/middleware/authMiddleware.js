/**
 * Authentication middleware for protecting routes
 *
 * Why separate from jwtMiddleware?
 * - Handles high-level auth logic
 * - Focuses on route protection and user session
 * - Can be extended for different auth strategies
 */

async function validateUserAuth(request, response, next) {
	// Get JWT from headers
	// Why use headers instead of body/query?
	// - Industry standard for token transmission
	// - Keeps authentication separate from request data
	let providedToken = request.headers.jwt;
	console.log(providedToken);

	// Early return if no token provided
	// Why 403 instead of 401?
	// - 401: Not authenticated
	// - 403: Authenticated but not authorized
	if (!providedToken) {
		return response.status(403).json({
			message: "Sign in to view this content!",
		});
	}

	// Verify and decode the JWT
	// Why check userId specifically?
	// - Ensures token contains required user data
	// - Guards against malformed tokens
	let decodedData = decodeJWT(providedToken);
	console.log(decodedData);
	if (decodedData.userId) {
		next();
	} else {
		return response.status(403).json({
			message: "Sign in to view this content!",
		});
	}
}

module.exports = {
	validateUserAuth,
};
