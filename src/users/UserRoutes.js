const express = require("express");
const router = express.Router();
const UserController = require("./UserController");
const { validateUserAuth } = require("../auth/AuthMiddleware");
const {
    canModifyUser,
    requireAdmin,
} = require("../utils/middleware/roleMiddleware");

/**
 * User routes handle user data management
 *
 * Why use Router?
 * - Modular routing
 * - Easier to apply middleware to group of routes
 * - Better code organization
 */

// All routes require authentication
router.use(validateUserAuth);

// Profile routes must come before parameterized routes
// Why? Express matches routes in order
// /profile would match /:userId if placed after
router.get("/profile", UserController.getProfile);
router.patch("/profile", UserController.updateProfile);

// Admin-only routes
router.get("/", requireAdmin, UserController.getAllUsers);
router.get("/:userId", canModifyUser, UserController.getUserById);
router.patch("/:userId", canModifyUser, UserController.updateUser);
router.delete("/:userId", canModifyUser, UserController.deleteUser);
router.patch("/:userId/role", requireAdmin, UserController.updateUserRole);

module.exports = router;
