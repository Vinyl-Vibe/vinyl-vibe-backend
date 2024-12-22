require("dotenv").config({ path: ".env.test" });
const mongoose = require("mongoose");
const { User } = require("../UserModel");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcrypt");

// Create an in-memory MongoDB server for testing
let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("User Model Tests", () => {
    let userId;

    // Test data setup
    beforeEach(async () => {
        const user = await User.create({
            email: "test@example.com",
            password: "password123",
            role: "user",
            profile: { firstName: "John", lastName: "Doe" }
        });
        userId = user._id.toString();
    });

    afterEach(async () => {
        // Clean up after each test
        await User.deleteMany({});
    });

    describe("Validation Tests", () => {
        it("should not save a user without an email", async () => {
            const user = new User({ password: "password123" });
            await expect(user.save()).rejects.toThrow();
        });

        it("should not save a user with an invalid email", async () => {
            const user = new User({ email: "invalid-email", password: "password123" });
            await expect(user.save()).rejects.toThrow();
        });

        it("should save a user with a valid email", async () => {
            const user = new User({ email: "valid@example.com", password: "password123" });
            await expect(user.save()).resolves.not.toThrow();
        });

        it("should set default role to 'user' if not provided", async () => {
            const user = new User({ email: "test@example.com", password: "password123" });
            const savedUser = await user.save();
            expect(savedUser.role).toBe("user");
        });
    });

    describe("Password Hashing and Comparison", () => {
        it("should hash the password before saving", async () => {
            const user = await User.findById(userId);
            const isPasswordCorrect = await user.comparePassword("password123");
            expect(isPasswordCorrect).toBe(true);
        });

        it("should not hash the password if it already exists", async () => {
            const user = await User.findById(userId);
            const originalPasswordHash = user.password;
            await user.save(); // Save again to trigger the pre-save hook
            expect(user.password).toBe(originalPasswordHash);
        });

        it("should return false if password is incorrect", async () => {
            const user = await User.findById(userId);
            const isPasswordCorrect = await user.comparePassword("incorrectPassword");
            expect(isPasswordCorrect).toBe(false);
        });
    });

    describe("toJSON Transformation", () => {
        it("should remove sensitive fields from the output", async () => {
            const user = await User.findById(userId);
            const userJSON = user.toJSON();
            expect(userJSON).not.toHaveProperty("password");
            expect(userJSON).not.toHaveProperty("resetPasswordToken");
            expect(userJSON).not.toHaveProperty("resetPasswordExpires");
        });

        it("should return the user data in the expected format", async () => {
            const user = await User.findById(userId);
            const userJSON = user.toJSON();
            expect(userJSON).toHaveProperty("email", "test@example.com");
            expect(userJSON).toHaveProperty("role", "user");
            expect(userJSON).toHaveProperty("profile");
            expect(userJSON).toHaveProperty("createdAt");
            expect(userJSON).toHaveProperty("updatedAt");
        });
    });
});
