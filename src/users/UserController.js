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
			// Extract query parameters
			// Why destructure with defaults?
			// - Ensures consistent behavior
			// - Prevents undefined errors
			const {
				search,          // Search in email
				role,           // Filter by role
				start_date,     // Filter by creation date range
				end_date,
				sort_by = 'email', // Sort field
				order = 'asc'      // Sort order
			} = req.query;

			// Build filters object
			// Why separate object?
			// - Cleaner code
			// - Easier to modify filters
			// - More maintainable
			const filters = {};
			if (search) filters.search = search;
			if (role) filters.role = role;
			if (start_date) filters.start_date = start_date;
			if (end_date) filters.end_date = end_date;

			// Build sort object
			const sort = {
				field: sort_by,
				order: order.toLowerCase()
			};

			// Validate sort field
			// Why validate?
			// - Prevent invalid database queries
			// - Security: prevent NoSQL injection
			const allowedSortFields = ['email', 'role', 'createdAt'];
			if (!allowedSortFields.includes(sort.field)) {
				throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, 400);
			}

			const users = await UserService.getAllUsers(filters, sort);
			res.json(users);
		} catch (error) {
			next(error);
		}
	},

	// GET /users/:userId - Get specific user
	async getUserById(req, res, next) {
		try {
			const { userId } = req.params;

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
