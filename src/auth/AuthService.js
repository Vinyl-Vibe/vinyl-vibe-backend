const jwt = require("jsonwebtoken");
const UserService = require("../users/UserService");

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
		// Create JWT with user info and roles
		// We include isAdmin flag directly in token for easy access
		// expiresIn ensures tokens must be refreshed periodically
		return jwt.sign(
			{
				userId: user._id,
				email: user.email,
				role: user.role,
				isAdmin: user.role === "admin",
			},
			process.env.JWT_SECRET,
			{ expiresIn: "7d" }
		);
	},

	async validateToken(token) {
		try {
			// jwt.verify both checks signature and decodes token
			// If token is invalid or expired, it throws an error
			return jwt.verify(token, process.env.JWT_SECRET);
		} catch (error) {
			throw new Error("Invalid token");
		}
	},

	async login({ email, password }) {
		// First find user - separate error for missing user vs wrong password
		// This is a security best practice to prevent user enumeration
		const user = await UserService.findUserByEmail(email);
		if (!user) {
			throw new Error("User not found");
		}

		// Password comparison is handled by UserModel method
		// This keeps password comparison logic with the User model
		const isValidPassword = await user.comparePassword(password);
		if (!isValidPassword) {
			throw new Error("Invalid password");
		}

		const token = await this.generateToken(user);

		return {
			token,
			user,
		};
	},
};

module.exports = AuthService;
