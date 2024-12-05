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
			required: true,
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
		resetPasswordToken: String,
		resetPasswordExpires: Date
	},
	{ timestamps: true }
);

// Pre-save hook runs before saving document
// Why here instead of UserService?
// - Ensures password is always hashed
// - Works for all save operations
// - Keeps password handling with User model
UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
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
	return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);

module.exports = {
	User,
};
