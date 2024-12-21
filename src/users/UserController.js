const UserService = require("./UserService");
const { AppError } = require("../utils/middleware/errorMiddleware");

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
                search, // Search in email
                role, // Filter by role
                start_date, // Filter by creation date range
                end_date,
                sort_by = "email", // Sort field
                order = "asc", // Sort order
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
                order: order.toLowerCase(),
            };

            // Validate sort field
            // Why validate?
            // - Prevent invalid database queries
            // - Security: prevent NoSQL injection
            const allowedSortFields = ["email", "role", "createdAt"];
            if (!allowedSortFields.includes(sort.field)) {
                throw new AppError(
                    `Invalid sort field. Allowed fields: ${allowedSortFields.join(
                        ", "
                    )}`,
                    400
                );
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
                throw new AppError("User not found", 404);
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
            const currentUser = req.user;

            const updatedUser = await UserService.updateUser(
                userId,
                updates,
                currentUser
            );
            if (!updatedUser) {
                throw new AppError("User not found", 404);
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
                throw new AppError("User not found", 404);
            }

            // 204 indicates successful deletion with no content returned
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },

    // GET /users/profile - Get current user profile
    async getProfile(req, res, next) {
        try {
            const userId = req.user._id;
            const profile = await UserService.getUserProfile(userId);

            if (!profile) {
                throw new AppError("Profile not found", 404);
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    },

    // PATCH /users/profile - Update current user profile
    async updateProfile(req, res, next) {
        try {
            const userId = req.user._id;
            const profileData = req.body;

            const updatedProfile = await UserService.updateUserProfile(
                userId,
                profileData
            );
            if (!updatedProfile) {
                throw new AppError("Profile not found", 404);
            }

            res.json(updatedProfile);
        } catch (error) {
            next(error);
        }
    },

    // Update user role (admin only)
    async updateUserRole(req, res, next) {
        try {
            const { userId } = req.params;
            const { role } = req.body;

            // Validate role
            const validRoles = ["user", "admin"];
            if (!validRoles.includes(role)) {
                throw new AppError(
                    `Invalid role. Must be one of: ${validRoles.join(", ")}`,
                    400
                );
            }

            // Prevent self-role change
            if (userId === req.user._id.toString()) {
                throw new AppError("Cannot modify your own role", 403);
            }

            const updatedUser = await UserService.updateUser(userId, { role });

            console.log(
                "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
                "\n👑 User role updated by:",
                req.user.email,
                "\nUser:",
                updatedUser.email,
                "\nNew role:",
                role,
                "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
            );

            res.status(200).json({
                status: "success",
                message: "User role updated successfully",
                user: {
                    id: updatedUser._id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                },
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = UserController;
