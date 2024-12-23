const { User } = require("./UserModel");
const { AppError } = require("../utils/middleware/errorMiddleware");
const mongoose = require("mongoose");

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
                throw new AppError("User already exists", 400);
            }
            return await User.create({ email, password });
        } catch (error) {
            if (error.isOperational) throw error;
            throw new AppError("Error creating user", 500);
        }
    },

    async getAllUsers(filters = {}, sort = {}) {
        try {
            // Build query
            let query = User.find();

            // Apply filters
            if (filters.search) {
                query = query.where("email", new RegExp(filters.search, "i"));
            }

            if (filters.role) {
                query = query.where("role", filters.role);
            }

            if (filters.start_date) {
                query = query
                    .where("createdAt")
                    .gte(new Date(filters.start_date));
            }

            if (filters.end_date) {
                query = query
                    .where("createdAt")
                    .lte(new Date(filters.end_date));
            }

            // Apply sorting
            const sortField = sort.field || "email";
            const sortOrder = sort.order === "desc" ? -1 : 1;
            query = query.sort({ [sortField]: sortOrder });

            // Execute query and transform results
            const users = await query.lean();

            // Transform each user document
            return users.map((user) => ({
                _id: user._id,
                email: user.email,
                role: user.role,
                profile: user.profile,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }));
        } catch (error) {
            throw new AppError("Error retrieving users", 500);
        }
    },

    async getUserById(userId, includeResetFields = false) {
        // If includeResetFields is false, exclude reset-related fields
        const fieldsToExclude = includeResetFields
            ? "-password"
            : "-password -resetPasswordToken -resetPasswordExpires";

        const user = await User.findById(userId).select(fieldsToExclude);
        if (!user) {
            throw new AppError("User not found", 404);
        }
        return user;
    },

    async updateUser(userId, updates, currentUser = null) {
        try {
            // Validate userId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new AppError("Invalid user ID", 400);
            }

            // Find the user first
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError("User not found", 404);
            }

            // If updating role, validate it
            if (updates.role) {
                const validRoles = ["user", "admin"];
                if (!validRoles.includes(updates.role)) {
                    throw new AppError(
                        `Invalid role. Must be one of: ${validRoles.join(
                            ", "
                        )}`,
                        400
                    );
                }
            }

            // Update the user
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updates },
                {
                    new: true, // Return updated document
                    runValidators: true, // Run schema validators
                }
            );

            if (!updatedUser) {
                throw new AppError("User not found", 404);
            }

            return updatedUser;
        } catch (error) {
            if (error instanceof AppError) throw error;
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
                "profile.firstName",
                "profile.lastName",
                "profile.phoneNumber",
                "profile.address.street",
                "profile.address.city",
                "profile.address.state",
                "profile.address.postalCode",
                "profile.address.country",
            ];

            // Transform the incoming data to match the nested structure
            const transformedData = Object.keys(profileData).reduce(
                (updates, key) => {
                    // Add the 'profile.' prefix to the field names
                    updates[`profile.${key}`] = profileData[key];
                    return updates;
                },
                {}
            );

            // Use findByIdAndUpdate with $set to only update provided fields
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: transformedData },
                {
                    new: true, // Return updated document
                    runValidators: true, // Run schema validators on update
                    select: "-password -resetPasswordToken -resetPasswordExpires", // Exclude sensitive fields
                }
            );

            if (!updatedUser) {
                throw new AppError("User not found", 404);
            }

            return updatedUser;
        } catch (error) {
            throw error;
        }
    },
};

module.exports = UserService;
