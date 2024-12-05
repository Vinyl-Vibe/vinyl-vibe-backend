const UserService = require("./UserService");
const { AppError } = require('../utils/middleware/errorMiddleware');

/**
 * UserController handles HTTP layer for user management
 * 
 * Why separate from AuthController?
 * - Auth handles identity verification
 * - UserController handles user data management
 * - Different concerns = different controllers
 */
const UserController = {
	// GET /users - Get all users (admin only)
	async getAllUsers(req, res, next) {
		try {
			// Admin-only endpoint
			// Why check role here instead of middleware?
			// - More specific error message
			// - Role check is specific to this route
			if (req.user.role !== "admin") {
				throw new AppError('Admin access required', 403);
			}

			const users = await UserService.getAllUsers();
			res.json(users);
		} catch (error) {
			next(error);
		}
	},

	// GET /users/:userId - Get specific user
	async getUserById(req, res, next) {
		try {
			const { userId } = req.params;

			// Users can only access their own data unless admin
			// This implements principle of least privilege
			if (req.user.role !== "admin" && req.user.userId !== userId) {
				throw new AppError('Unauthorised access', 403);
			}

			const user = await UserService.getUserById(userId);
			if (!user) {
				throw new AppError('User not found', 404);
			}

			res.json(user);
		} catch (error) {
			next(error);
		}
	},

	// PUT /users/:userId - Update user
	async updateUser(req, res, next) {
		try {
			const { userId } = req.params;
			const updates = req.body;

			// Same access control as getUserById
			if (req.user.role !== "admin" && req.user.userId !== userId) {
				throw new AppError('Unauthorised access', 403);
			}

			// Non-admins cannot change roles
			// Why delete instead of 403?
			// - Allows partial updates to succeed
			// - Follows principle of being liberal in what you accept
			if (updates.role && req.user.role !== "admin") {
				delete updates.role;
			}

			const updatedUser = await UserService.updateUser(userId, updates);
			if (!updatedUser) {
				throw new AppError('User not found', 404);
			}

			res.json(updatedUser);
		} catch (error) {
			next(error);
		}
	},

	// DELETE /users/:userId - Delete user
	async deleteUser(req, res, next) {
		try {
			const { userId } = req.params;

			// Same access control pattern
			if (req.user.role !== "admin" && req.user.userId !== userId) {
				throw new AppError('Unauthorised access', 403);
			}

			const deletedUser = await UserService.deleteUser(userId);
			if (!deletedUser) {
				throw new AppError('User not found', 404);
			}

			// 204 indicates successful deletion with no content returned
			res.status(204).send();
		} catch (error) {
			next(error);
		}
	},
};

module.exports = UserController;
