/**
 * Authentication middleware for protecting routes
 * 
 * Why in auth folder?
 * - Groups all authentication-related code together
 * - Makes dependencies clearer (auth middleware depends on auth services)
 * - Follows separation of concerns principle
 * - Makes it easier to find and maintain auth-related code
 */

const { AppError } = require('../utils/middleware/errorMiddleware')
const { decodeJWT } = require('../utils/middleware/jwtMiddleware')

async function validateUserAuth(request, response, next) {
    try {
        // Get JWT from headers
        // Why use headers instead of body/query?
        // - Industry standard for token transmission
        // - Keeps authentication separate from request data
        // - Allows for consistent token handling across routes
        let providedToken = request.headers.jwt

        // Early return if no token provided
        // Why 403 instead of 401?
        // - 401: Not authenticated (no credentials)
        // - 403: Authenticated but not authorised
        // - More specific error for client handling
        if (!providedToken) {
            throw new AppError("Sign in to view this content!", 403)
        }

        // Verify and decode the JWT
        // Why check userId specifically?
        // - Ensures token contains required user data
        // - Guards against malformed tokens
        // - Validates token structure matches our requirements
        let decodedData = decodeJWT(providedToken)
        if (!decodedData.userId) {
            throw new AppError("Sign in to view this content!", 403)
        }

        // Add decoded user data to request
        // Why add to request?
        // - Makes user data available to downstream middleware and routes
        // - Prevents need to decode token multiple times
        request.user = decodedData

        next()
    } catch (error) {
        next(error)
    }
}

// Add admin check middleware
// Why separate middleware?
// - Single responsibility principle
// - Can be used independently of basic auth
// - Makes role requirements explicit in routes
const validateAdminAuth = async (request, response, next) => {
    try {
        // First run user auth
        await validateUserAuth(request, response, () => {
            // Check if user is admin
            if (!request.user.isAdmin) {
                throw new AppError('Admin access required', 403)
            }
            next()
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    validateUserAuth,
    validateAdminAuth
} 