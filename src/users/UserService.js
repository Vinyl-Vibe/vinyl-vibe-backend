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
			const sortField = sort.field || 'email';
			const sortOrder = sort.order === 'desc' ? -1 : 1;
			query = query.sort({ [sortField]: sortOrder });

			// Execute query and transform results
			const users = await query.lean();

			// Transform each user document
			return users.map(user => ({
				_id: user._id,
				email: user.email,
				role: user.role,
				profile: user.profile,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt
			}));

		} catch (error) {
			throw new AppError('Error retrieving users', 500);
		}
	},

	async getUserById(userId, includeResetFields = false) {
		// If includeResetFields is false, exclude reset-related fields
		const fieldsToExclude = includeResetFields 
			? '-password' 
			: '-password -resetPasswordToken -resetPasswordExpires';
			
		const user = await User.findById(userId).select(fieldsToExclude);
		if (!user) {
			throw new AppError("User not found", 404);
		}
		return user;
	},

	async updateUser(userId, updates, currentUser) {
		try {
			// Correctly checks role for sensitive operations
			if (updates.role && currentUser.role !== 'admin') {
				throw new AppError('Only administrators can modify user roles', 403)
			}
			// Correctly checks ownership/admin status
			if (currentUser.role !== 'admin' && currentUser.userId !== userId) {
				throw new AppError('You can only modify your own account', 403)
			}

			return User.findByIdAndUpdate(
				userId,
				{ $set: updates },
				{ new: true, runValidators: true }
			).select('-password')
		} catch (error) {
			if (error.isOperational) throw error
			throw new AppError('Error updating user', 500)
		}
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
		// First check if user exists
		const user = await User.findById(userId);
		if (!user) {
			throw new AppError('User not found', 404);
		}

		// Handle partial updates for nested objects
		const updatedProfile = {
			firstName: profileData.firstName || user.profile?.firstName,
			lastName: profileData.lastName || user.profile?.lastName,
			phoneNumber: profileData.phoneNumber || user.profile?.phoneNumber,
			address: profileData.address ? {
				street: profileData.address.street || user.profile?.address?.street,
				city: profileData.address.city || user.profile?.address?.city,
				state: profileData.address.state || user.profile?.address?.state,
				postalCode: profileData.address.postalCode || user.profile?.address?.postalCode,
				country: profileData.address.country || user.profile?.address?.country
			} : user.profile?.address
		};

		// Update only the fields that are provided
		user.profile = updatedProfile;

		// Save and return the updated user
		const updatedUser = await user.save();
		
		// Return without sensitive data and reorder fields
		return updatedUser.toObject({
			transform: (doc, ret) => {
				// Create new object with desired order
				const ordered = {
					_id: ret._id,
					email: ret.email,
					role: ret.role,
					profile: ret.profile,
					createdAt: ret.createdAt,
					updatedAt: ret.updatedAt
				};
				
				// Remove sensitive fields
				delete ret.password;
				delete ret.resetPasswordToken;
				delete ret.resetPasswordExpires;
				delete ret.__v;
				
				return ordered;
			},
			versionKey: false // This also removes __v
		});
	}
};

module.exports = UserService;