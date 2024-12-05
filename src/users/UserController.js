const UserService = require("./UserService");

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
	async getAllUsers(req, res) {
		try {
			// Admin-only endpoint
			// Why check role here instead of middleware?
			// - More specific error message
			// - Role check is specific to this route
			if (req.user.role !== "admin") {
				return res.status(403).json({ error: "Admin access required" });
			}

			const users = await UserService.getAllUsers();
			res.json(users);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	},

	// GET /users/:userId - Get specific user
	async getUserById(req, res) {
		try {
			const { userId } = req.params;

			// Users can only access their own data unless admin
			// This implements principle of least privilege
			if (req.user.role !== "admin" && req.user.userId !== userId) {
				return res.status(403).json({ error: "Unauthorised access" });
			}

			const user = await UserService.getUserById(userId);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}

			res.json(user);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	},

	// PUT /users/:userId - Update user
	async updateUser(req, res) {
		try {
			const { userId } = req.params;
			const updates = req.body;

			// Same access control as getUserById
			if (req.user.role !== "admin" && req.user.userId !== userId) {
				return res.status(403).json({ error: "Unauthorised access" });
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
				return res.status(404).json({ error: "User not found" });
			}

			res.json(updatedUser);
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	},

	// DELETE /users/:userId - Delete user
	async deleteUser(req, res) {
		try {
			const { userId } = req.params;

			// Same access control pattern
			if (req.user.role !== "admin" && req.user.userId !== userId) {
				return res.status(403).json({ error: "Unauthorised access" });
			}

			const deletedUser = await UserService.deleteUser(userId);
			if (!deletedUser) {
				return res.status(404).json({ error: "User not found" });
			}

			// 204 indicates successful deletion with no content returned
			res.status(204).send();
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	},
};

module.exports = UserController;
