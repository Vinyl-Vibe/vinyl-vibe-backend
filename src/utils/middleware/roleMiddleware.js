/**
 * Role-based access control middleware
 * 
 * Why separate from authMiddleware?
 * - Separation of concerns: auth checks vs permission checks
 * - More flexible role combinations
 * - Reusable across different routes
 * - Easier to test and maintain
 */

const { AppError } = require('./errorMiddleware');

/**
 * Create middleware for checking user roles
 * 
 * Why factory pattern?
 * - Allows dynamic role requirements
 * - Can combine multiple roles
 * - Reusable across different routes
 * - Consistent error handling
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        try {
            // Check if user exists and has role property
            // Why check user object?
            // - Ensures auth middleware ran first
            // - Validates token data structure
            // - Prevents undefined errors
            if (!req.user || !req.user.role) {
                throw new AppError('User not authenticated', 401);
            }

            // Check if user has required role
            // Why includes instead of equality?
            // - Supports multiple role requirements
            // - More flexible permission system
            // - Future-proof for role hierarchies
            if (!roles.includes(req.user.role)) {
                throw new AppError('Insufficient permissions', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware for admin-only routes
 * 
 * Why separate admin middleware?
 * - Common use case
 * - Cleaner route definitions
 * - Clear intent in code
 */
const requireAdmin = requireRole('admin');

/**
 * Check if user has access to requested resource
 * 
 * Why resource ownership middleware?
 * - Common pattern in user data access
 * - Implements principle of least privilege
 * - Reusable across user-specific routes
 */
const requireOwnership = (paramName = 'userId') => {
    return (req, res, next) => {
        try {
            const resourceId = req.params[paramName];
            
            // Allow admins to access any resource
            if (req.user.role === 'admin') {
                return next();
            }

            // Check if user owns the resource
            if (req.user.userId !== resourceId) {
                throw new AppError('Unauthorised access to resource', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    requireRole,
    requireAdmin,
    requireOwnership
}; 