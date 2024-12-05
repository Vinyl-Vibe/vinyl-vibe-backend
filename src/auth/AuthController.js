const AuthService = require("./AuthService");
const UserService = require("../users/UserService");
const EmailService = require('../utils/emailService');
const { AppError } = require('../utils/middleware/errorMiddleware');

/**
 * AuthController handles the HTTP layer of authentication
 *
 * Why separate Controller from Service?
 * - Controllers handle HTTP-specific logic (req/res, status codes, headers)
 * - Services handle business logic (can be reused in different contexts)
 * - Makes testing easier as we can test business logic without HTTP
 */
const AuthController = {
	async register(req, res, next) {
		try {
			const { email, password } = req.body;

			// Early validation pattern - check requirements before doing any work
			// This saves database calls and improves response time for invalid requests
			if (!email || !password) {
				throw new AppError('Email and password are required', 400);
			}

			// Create user first, then generate token
			// Why this order? If token generation fails, we don't want an unverified user in our DB
			const newUser = await UserService.createUser({ email, password });
			const token = await AuthService.generateToken(newUser);

			// 201 status indicates resource creation
			// We return both token and user data to prevent an extra API call from the client
			res.status(201).json({
				token,
				user: {
					id: newUser._id,
					email: newUser.email,
					role: newUser.role,
				},
			});
		} catch (error) {
			next(error); // Pass to error handling middleware
		}
	},

	async login(req, res, next) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				throw new AppError('Email and password are required', 400);
			}

			// AuthService.login handles credential verification and token generation
			// We separate this logic because it might be used by other auth methods (OAuth, SSO)
			const { token, user } = await AuthService.login({ email, password });

			res.json({
				token,
				user: {
					id: user._id,
					email: user.email,
					role: user.role,
				},
			});
		} catch (error) {
			// Convert all login errors to 401 Invalid credentials
			// Why? Don't reveal specific auth failures (security best practice)
			next(new AppError('Invalid credentials', 401));
		}
	},

	async logout(req, res, next) {
		try {
			// With JWTs, logout is handled client-side by removing the token
			// We still have this endpoint for:
			// 1. Future token blacklisting implementation
			// 2. Consistency in API design
			// 3. Client-side logout tracking
			res.json({ message: "Logged out successfully" });
		} catch (error) {
			next(error);
		}
	},

	async refresh(req, res, next) {
		try {
			// Token comes from Authorization header
			// Split removes 'Bearer ' prefix from token
			const token = req.headers.authorization?.split(" ")[1];

			if (!token) {
				throw new AppError('No token provided', 401);
			}

			// Verify current token and get fresh user data
			// Why get fresh user data? User's roles/permissions might have changed
			const decoded = await AuthService.validateToken(token);
			const user = await UserService.getUserById(decoded.userId);

			if (!user) {
				throw new AppError('User not found', 404);
			}

			// Generate new token with fresh user data
			const newToken = await AuthService.generateToken(user);

			res.json({
				token: newToken,
				user: {
					id: user._id,
					email: user.email,
					role: user.role,
				},
			});
		} catch (error) {
			next(error);
		}
	},

	async forgotPassword(req, res, next) {
		try {
			const { email } = req.body;

			if (!email) {
				throw new AppError('Email is required', 400);
			}

			// Initiate password reset
			// Note: This returns success even if email doesn't exist (security through obscurity)
			await AuthService.initiatePasswordReset(email);

			res.json({
				message: 'If an account exists with that email, a password reset link has been sent.'
			});
		} catch (error) {
			next(error);
		}
	},

	async resetPassword(req, res, next) {
		try {
			const { token, newPassword } = req.body;

			if (!token || !newPassword) {
				throw new AppError('Token and new password are required', 400);
			}

			// Validate password requirements
			// Why check length? Basic security requirement
			// More complex validation should be moved to a validation middleware
			if (newPassword.length < 8) {
				throw new AppError('Password must be at least 8 characters long', 400);
			}

			// Process password reset and generate new auth token
			const user = await AuthService.resetPassword(token, newPassword);
			const authToken = await AuthService.generateToken(user);

			res.json({
				message: 'Password successfully reset',
				token: authToken
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = AuthController;
