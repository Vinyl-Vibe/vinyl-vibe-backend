require("dotenv").config({ path: ".env.test" });
const mongoose = require("mongoose");
const { User } = require("../../users/UserModel");
const AuthService = require("../../auth/AuthService");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const { AppError } = require("../../utils/middleware/errorMiddleware");

// Create an in-memory MongoDB server for testing
let mongoServer;
let testUser;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Create a test user
    testUser = await User.create({
        email: "test@example.com",
        password: "password123",
        role: "user",
        profile: { firstName: "John", lastName: "Doe" },
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("AuthService Tests", () => {
    describe("generateToken", () => {
        it("should generate a JWT token for a valid user", async () => {
            const token = await AuthService.generateToken(testUser);
            expect(token).toBeDefined();
        });

        it("should throw an error if token generation fails", async () => {
            // Mock error in generateJWT function
            const originalGenerateJWT = require('../auth/AuthMiddleware').generateJWT;
            require('../auth/AuthMiddleware').generateJWT = jest.fn().mockImplementation(() => {
                throw new Error("Token generation failed");
            });
            await expect(AuthService.generateToken(testUser)).rejects.toThrow("Error generating token");
            require('../auth/AuthMiddleware').generateJWT = originalGenerateJWT; // Restore original function
        });
    });

    describe("login", () => {
        it("should log in with valid credentials", async () => {
            const result = await AuthService.login({ email: testUser.email, password: "password123" });
            expect(result.token).toBeDefined();
            expect(result.user.email).toBe(testUser.email);
        });

        it("should throw an error for invalid email", async () => {
            await expect(AuthService.login({ email: "wrong@example.com", password: "password123" }))
                .rejects.toThrow("Invalid credentials");
        });

        it("should throw an error for incorrect password", async () => {
            await expect(AuthService.login({ email: testUser.email, password: "wrongPassword" }))
                .rejects.toThrow("Invalid credentials");
        });
    });

    describe("initiatePasswordReset", () => {
        it("should initiate password reset for valid email", async () => {
            const email = testUser.email;
            await expect(AuthService.initiatePasswordReset(email)).resolves.not.toThrow();
        });

        it("should not throw an error if email is not found", async () => {
            await expect(AuthService.initiatePasswordReset("nonexistent@example.com")).resolves.not.toThrow();
        });

        it("should revert token if email fails", async () => {
            const email = testUser.email;
            const sendEmailMock = jest.spyOn(require('../utils/emailService'), 'sendPasswordReset').mockRejectedValue(new Error("Email send failed"));
            await expect(AuthService.initiatePasswordReset(email)).rejects.toThrow("Failed to send password reset email");
            sendEmailMock.mockRestore();
        });
    });

    describe("resetPassword", () => {
        it("should reset password with a valid token", async () => {
            const token = "valid-reset-token";
            const newPassword = "newPassword123";
            const user = await User.findById(testUser._id);
            await AuthService.resetPassword(token, newPassword);
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.password).not.toBe(user.password);
        });

        it("should throw an error if the token is invalid or expired", async () => {
            await expect(AuthService.resetPassword("invalid-token", "newPassword123"))
                .rejects.toThrow("Invalid or expired reset token");
        });
    });

    describe("validateToken", () => {
        it("should validate a valid token", async () => {
            const token = jwt.sign({ _id: testUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const user = await AuthService.validateToken(token);
            expect(user.email).toBe(testUser.email);
        });

        it("should throw an error for an invalid token", async () => {
            const invalidToken = "invalid-token";
            await expect(AuthService.validateToken(invalidToken)).rejects.toThrow("Invalid token");
        });
    });
});
