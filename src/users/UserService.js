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
			// Check if user exists first
			const userToUpdate = await User.findById(userId);
			if (!userToUpdate) {
				throw new AppError('User not found', 404);
			}

			// Only allow self-update or admin update
			if (currentUser.role !== 'admin' && currentUser._id !== userId) {
				throw new AppError('You can only update your own profile', 403);
			}

			// Define allowed fields based on user role
			const allowedFields = ['email', 'profile'];
			if (currentUser.role === 'admin') {
				allowedFields.push('role');
			}

			// Validate fields
			const invalidFields = Object.keys(updates).filter(
				key => !allowedFields.includes(key)
			);

			if (invalidFields.length > 0) {
				throw new AppError(
					`Invalid fields: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`,
					400
				);
			}

			// If trying to update role without being admin
			if (updates.role && currentUser.role !== 'admin') {
				throw new AppError('Only administrators can update user roles', 403);
			}

			// Transform nested updates if profile is included
			const transformedUpdates = Object.keys(updates).reduce((acc, key) => {
				if (key === 'profile') {
					// Handle nested profile updates
					Object.keys(updates.profile).forEach(profileKey => {
						if (profileKey === 'address') {
							// Handle nested address updates
							Object.keys(updates.profile.address).forEach(addressKey => {
								const fullPath = `profile.address.${addressKey}`;
								if (allowedUpdates.includes(fullPath)) {
									acc[fullPath] = updates.profile.address[addressKey];
								}
							});
						} else {
							const fullPath = `profile.${profileKey}`;
							if (allowedUpdates.includes(fullPath)) {
								acc[fullPath] = updates.profile[profileKey];
							}
						}
					});
				} else {
					// Handle top-level updates
					if (allowedFields.includes(key)) {
						acc[key] = updates[key];
					}
				}
				return acc;
			}, {});

			// Use findByIdAndUpdate with $set for partial updates
			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ $set: transformedUpdates },
				{ 
					new: true,
					runValidators: true,
					select: '-password -resetPasswordToken -resetPasswordExpires'
				}
			);

			if (!updatedUser) {
				throw new AppError('User not found', 404);
			}

			return updatedUser;
		} catch (error) {
			if (error.isOperational) throw error;
			throw new AppError(`Error updating user: ${error.message}`, 500);
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
		try {
			// Define which fields can be updated via PATCH
			const allowedUpdates = [
				'profile.firstName',
				'profile.lastName',
				'profile.phoneNumber',
				'profile.address.street',
				'profile.address.city',
				'profile.address.state',
				'profile.address.postalCode',
				'profile.address.country'
			]

			// Transform the incoming data to match the nested structure
			const transformedData = Object.keys(profileData).reduce((updates, key) => {
				// Add the 'profile.' prefix to the field names
				updates[`profile.${key}`] = profileData[key]
				return updates
			}, {})

			// Use findByIdAndUpdate with $set to only update provided fields
			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ $set: transformedData },
				{ 
					new: true,          // Return updated document
					runValidators: true, // Run schema validators on update
					select: '-password -resetPasswordToken -resetPasswordExpires' // Exclude sensitive fields
				}
			)

			if (!updatedUser) {
				throw new AppError('User not found', 404)
			}

			return updatedUser
		} catch (error) {
			throw error
		}
	}
};

module.exports = UserService;