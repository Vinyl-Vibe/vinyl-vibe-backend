const express = require('express')
const router = express.Router()
const UserController = require('./UserController')
const { validateUserAuth } = require('./UserMiddleware')
const { requireAdmin, requireOwnership } = require('../utils/middleware/roleMiddleware')

/**
 * User routes handle user data management
 * 
 * Why use Router?
 * - Modular routing
 * - Easier to apply middleware to group of routes
 * - Better code organization
 */

// All user routes require authentication
// Apply middleware to all routes in this router
router.use(validateUserAuth)

// Route definitions with role-based access control
router.get('/', requireAdmin, UserController.getAllUsers)           // Admin only
router.get('/:userId', requireOwnership(), UserController.getUserById)    // Own user or admin
router.put('/:userId', requireOwnership(), UserController.updateUser)     // Own user or admin
router.delete('/:userId', requireOwnership(), UserController.deleteUser)  // Own user or admin

module.exports = router
