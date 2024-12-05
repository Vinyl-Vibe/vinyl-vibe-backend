const express = require('express')
const router = express.Router()
const UserController = require('./UserController')
const { validateUserAuth } = require('./UserMiddleware')

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

// Route definitions with comments about access control
router.get('/', UserController.getAllUsers)           // Admin only
router.get('/:userId', UserController.getUserById)    // Own user or admin
router.put('/:userId', UserController.updateUser)     // Own user or admin
router.delete('/:userId', UserController.deleteUser)  // Own user or admin

module.exports = router
