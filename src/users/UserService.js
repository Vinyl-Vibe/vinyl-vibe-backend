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

	async getAllUsers(filters = {}, sort = {}) {
		try {
			// Build query
			let query = User.find();

			// Apply filters
			if (filters.search) {
				// Search in email field
				// Why use regex? Allows partial matches
				// Why case-insensitive? Better user experience
				query = query.where('email', new RegExp(filters.search, 'i'));
			}

			if (filters.role) {
				query = query.where('role', filters.role);
			}

			if (filters.start_date) {
				query = query.where('createdAt').gte(new Date(filters.start_date));
			}

			if (filters.end_date) {
				query = query.where('createdAt').lte(new Date(filters.end_date));
			}

			// Apply sorting
			// Why use -1/1? MongoDB sort syntax
			// Why default to email? Consistent ordering
			const sortField = sort.field || 'email';
			const sortOrder = sort.order === 'desc' ? -1 : 1;
			query = query.sort({ [sortField]: sortOrder });

			// Exclude password from results
			query = query.select('-password');

			return await query.exec();
		} catch (error) {
			throw new AppError('Error retrieving users', 500);
		}
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

	async getUserProfile(userId) {
		return User.findById(userId)
			.select("-password -resetPasswordToken -resetPasswordExpires")
			.lean();
	},

	async updateUserProfile(userId, profileData) {
		return User.findByIdAndUpdate(
			userId,
			{ 
				$set: { 
					'profile': profileData 
				} 
			},
			{ 
				new: true, 
				runValidators: true 
			}
		).select("-password");
	}
};

module.exports = UserService;