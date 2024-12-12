const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * User Schema defines the structure and behavior of User documents
 * 
 * Why Mongoose?
 * - Provides schema validation
 * - Handles type conversion
 * - Middleware capabilities
 * - Built-in password hashing
 */
const UserSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email validation regex
		},
		password: {
			type: String,
			required: function() {
				// Password only required if no social logins
				return this.socialLogins.length === 0;
			},
			minLength: 8,
			trim: true,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		profile: {
			firstName: {
				type: String,
				trim: true
			},
			lastName: {
				type: String,
				trim: true
			},
			phoneNumber: {
				type: String,
				trim: true
			},
			address: {
				street: String,
				city: String,
				state: String,
				postalCode: String,
				country: String
			}
		},
		socialLogins: [{
			provider: {
				type: String,
				enum: ['google', 'apple'],
				required: true
			},
			providerId: {
				type: String,
				required: true
			},
			email: {
				type: String,
				required: true
			},
			// Store additional provider-specific data
			profile: {
				type: mongoose.Schema.Types.Mixed,
				default: {}
			}
		}],
		resetPasswordToken: String,
		resetPasswordExpires: Date
	},
	{ 
		timestamps: true,
		versionKey: false,  // This removes __v from all responses
		toJSON: { 
			transform: (doc, ret) => {
				// Create ordered object
				const ordered = {
					_id: ret._id,
					email: ret.email,
					role: ret.role,
					profile: ret.profile,
					socialLogins: ret.socialLogins.map(login => ({
						provider: login.provider,
						email: login.email
					})),
					createdAt: ret.createdAt,
					updatedAt: ret.updatedAt
				};
				
				// Remove sensitive fields
				delete ret.password;
				delete ret.resetPasswordToken;
				delete ret.resetPasswordExpires;
				
				return ordered;
			}
		},
		toObject: {
			transform: (doc, ret) => {
				// Same transform for toObject
				const ordered = {
					_id: ret._id,
					email: ret.email,
					role: ret.role,
					profile: ret.profile,
					socialLogins: ret.socialLogins.map(login => ({
						provider: login.provider,
						email: login.email
					})),
					createdAt: ret.createdAt,
					updatedAt: ret.updatedAt
				};
				
				delete ret.password;
				delete ret.resetPasswordToken;
				delete ret.resetPasswordExpires;
				
				return ordered;
			}
		}
	}
);

// Pre-save hook runs before saving document
// Why here instead of UserService?
// - Ensures password is always hashed
// - Works for all save operations
// - Keeps password handling with User model
UserSchema.pre("save", async function (next) {
	// Only hash password if it exists and was modified
	if (!this.password || !this.isModified("password")) return next();
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Instance method for password comparison
// Why async?
// - bcrypt.compare is async
// - Better performance for server
UserSchema.methods.comparePassword = async function (candidatePassword) {
	// If no password set (social login only), always return false
	if (!this.password) return false;
	return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);

module.exports = {
	User,
};