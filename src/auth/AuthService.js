const { generateJWT } = require('./AuthMiddleware')
const UserService = require("../users/UserService");
const crypto = require('crypto')
const EmailService = require('../utils/emailService')
const { AppError } = require('../utils/middleware/errorMiddleware')

/**
 * AuthService handles business logic for authentication
 *
 * Why use JWT?
 * - Stateless: No need to store session data
 * - Scalable: Works across multiple servers
 * - Self-contained: Contains all necessary user info
 * - Secure: Cryptographically signed
 */
const AuthService = {
	async generateToken(user) {
		try {
			return generateJWT(user._id, user.email, user.role);
		} catch (error) {
			throw new AppError('Error generating token', 500);
		}
	},

	async login({ email, password }) {
		// First find user - separate error for missing user vs wrong password
		// This is a security best practice to prevent user enumeration
		const user = await UserService.findUserByEmail(email);
		if (!user) {
			throw new AppError("Invalid credentials", 401);
		}

		// Password comparison is handled by UserModel method
		// This keeps password comparison logic with the User model
		const isValidPassword = await user.comparePassword(password);
		if (!isValidPassword) {
			throw new AppError("Invalid credentials", 401);
		}

		const token = await this.generateToken(user);

		return {
			token,
			user,
		};
	},

	async initiatePasswordReset(email) {
		// Find user and validate email exists
		const user = await UserService.findUserByEmail(email)
		if (!user) {
			// Return success even if user not found (security best practice)
			return
		}

		// Generate random token
		const resetToken = crypto.randomBytes(32).toString('hex')
		const hashedToken = crypto
			.createHash('sha256')
			.update(resetToken)
			.digest('hex')

		// Save hashed token to user
		await UserService.updateUser(user._id, {
			resetPasswordToken: hashedToken,
			resetPasswordExpires: Date.now() + 3600000 // 1 hour
		})

		// Send reset email
		try {
			await EmailService.sendPasswordReset(email, resetToken)
		} catch (error) {
			// Revert token if email fails
			await UserService.updateUser(user._id, {
				resetPasswordToken: null,
				resetPasswordExpires: null
			})
			throw error
		}
	},

	async resetPassword(token, newPassword) {
		// Hash token for comparison
		const hashedToken = crypto
			.createHash('sha256')
			.update(token)
			.digest('hex')

		// Find user with valid token
		const user = await User.findOne({
			resetPasswordToken: hashedToken,
			resetPasswordExpires: { $gt: Date.now() }
		})

		if (!user) {
			throw new AppError('Invalid or expired reset token', 401);
		}

		// Update password and clear reset token
		user.password = newPassword
		user.resetPasswordToken = undefined
		user.resetPasswordExpires = undefined
		await user.save() // This will trigger password hashing via pre-save hook

		return user
	}
};

module.exports = AuthService;