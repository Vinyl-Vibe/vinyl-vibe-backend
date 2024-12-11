const express = require("express");
const router = express.Router();
const UserController = require("./UserController");
const { validateUserAuth } = require("../auth/AuthMiddleware");
const {
    requireAdmin,
    requireOwnership,
} = require("../utils/middleware/roleMiddleware");

/**
 * User routes handle user data management
 *
 * Why use Router?
 * - Modular routing
 * - Easier to apply middleware to group of routes
 * - Better code organization
 */

// All user routes require authentication
router.use(validateUserAuth);

// Profile routes must come before parameterized routes
// Why? Express matches routes in order
// /profile would match /:userId if placed after
router.get("/profile", validateUserAuth, UserController.getProfile);
router.put("/profile", validateUserAuth, UserController.updateProfile);

// Route definitions with role-based access control
router.get("/", requireAdmin, UserController.getAllUsers); // Admin only
router.get("/:userId", requireOwnership(), UserController.getUserById); // Own user or admin
router.put("/:userId", requireOwnership(), UserController.updateUser); // Own user or admin
router.delete("/:userId", requireOwnership(), UserController.deleteUser); // Own user or admin

module.exports = router;
