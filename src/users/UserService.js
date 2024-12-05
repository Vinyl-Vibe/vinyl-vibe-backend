const { User } = require("./UserModel");
const { AppError } = require('../utils/middleware/errorMiddleware');

/**
 * UserService handles business logic for user operations
 * 
 * Why Service Layer?
 * - Separates business logic from HTTP layer
 * - Reusable across different parts of application
 * - Easier to test business logic
 */
const UserService = {
	async createUser({ email, password }) {
		try {
			const existingUser = await User.findOne({ email });
			if (existingUser) {
				throw new AppError('User already exists', 400);
			}
			return await User.create({ email, password });
		} catch (error) {
			if (error.isOperational) throw error;
			throw new AppError('Error creating user', 500);
		}
	},

	async getAllUsers() {
		// Exclude password from results
		// Why? Security best practice - passwords should never leave the server
		return User.find({}).select("-password");
	},

	async getUserById(userId) {
		return User.findById(userId).select("-password");
	},

	async updateUser(userId, updates) {
		// Use findByIdAndUpdate for atomic updates
		// new: true returns updated document
		// runValidators ensures schema validation runs on update
		return User.findByIdAndUpdate(
			userId,
			{ $set: updates },
			{ new: true, runValidators: true }
		).select("-password");
	},

	async deleteUser(userId) {
		return User.findByIdAndDelete(userId);
	},

	async findUserByEmail(email) {
		// Include password here because it's needed for login
		// Password comparison is handled by UserModel method
		return User.findOne({ email });
	},
};

module.exports = UserService;
