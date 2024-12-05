const AuthService = require("./AuthService");
const UserService = require("../users/UserService");

/**
 * AuthController handles the HTTP layer of authentication
 *
 * Why separate Controller from Service?
 * - Controllers handle HTTP-specific logic (req/res, status codes, headers)
 * - Services handle business logic (can be reused in different contexts)
 * - Makes testing easier as we can test business logic without HTTP
 */
const AuthController = {
	async register(req, res) {
		try {
			const { email, password } = req.body;

			// Early validation pattern - check requirements before doing any work
			// This saves database calls and improves response time for invalid requests
			if (!email || !password) {
				return res.status(400).json({
					error: "Email and password are required",
				});
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
			// 500 indicates server error - used when error isn't user's fault
			res.status(500).json({ error: error.message });
		}
	},

	async login(req, res) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				return res.status(400).json({
					error: "Email and password are required",
				});
			}

			// AuthService.login handles credential verification and token generation
			// We separate this logic because it might be used by other auth methods (OAuth, SSO)
			const { token, user } = await AuthService.login({
				email,
				password,
			});

			res.json({
				token,
				user: {
					id: user._id,
					email: user.email,
					role: user.role,
				},
			});
		} catch (error) {
			// 401 indicates authentication failure
			res.status(401).json({ error: "Invalid credentials" });
		}
	},

	async logout(req, res) {
		try {
			// With JWTs, logout is handled client-side by removing the token
			// We still have this endpoint for:
			// 1. Future token blacklisting implementation
			// 2. Consistency in API design
			// 3. Client-side logout tracking
			res.json({ message: "Logged out successfully" });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	},

	async refresh(req, res) {
		try {
			// Token comes from Authorization header
			// Split removes 'Bearer ' prefix from token
			const token = req.headers.authorization?.split(" ")[1];

			if (!token) {
				return res.status(401).json({ error: "No token provided" });
			}

			// Verify current token and get fresh user data
			// Why get fresh user data? User's roles/permissions might have changed
			const decoded = await AuthService.validateToken(token);
			const user = await UserService.getUserById(decoded.userId);

			if (!user) {
				return res.status(404).json({ error: "User not found" });
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
			res.status(401).json({ error: "Invalid token" });
		}
	},
};

module.exports = AuthController;
