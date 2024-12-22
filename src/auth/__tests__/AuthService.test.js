require("dotenv").config({ path: ".env.test" });
const mongoose = require("mongoose");
const { User } = require("../../users/UserModel");
const AuthService = require("../AuthService");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const { AppError } = require("../../utils/middleware/errorMiddleware");
const crypto = require("crypto");

// Define JWT_SECRET for tests
global.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

// Mock generateJWT from AuthMiddleware
jest.mock("../../auth/AuthMiddleware", () => ({
    generateJWT: jest.fn().mockImplementation((userId, email, role) => {
        if (userId === "throw") {
            throw new Error("Token generation failed");
        }
        return "mocked-jwt-token";
    }),
}));

// Mock sendPasswordReset from emailService
jest.mock("../../utils/emailService", () => ({
    sendPasswordReset: jest.fn().mockResolvedValue(true),
}));

// Mock User model
jest.mock("../../users/UserModel", () => ({
    User: {
        create: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        deleteMany: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

// At the top with other mocks
jest.mock("../../users/UserService", () => ({
    getUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    updateUser: jest.fn(),
}));

let mongoServer;
let testUser;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

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
    beforeEach(() => {
        jest.clearAllMocks();

        testUser = {
            _id: new mongoose.Types.ObjectId(),
            email: "test@example.com",
            password: "password123",
            role: "user",
            comparePassword: jest.fn().mockImplementation(async (password) => {
                return password === "password123";
            }),
            save: jest.fn().mockResolvedValue(true),
        };

        // Setup UserService mock implementations
        const UserService = require("../../users/UserService");
        UserService.findUserByEmail.mockResolvedValue(testUser);
        UserService.getUserById.mockResolvedValue(testUser);
        UserService.updateUser.mockResolvedValue(testUser);

        // Setup User model mocks
        User.findOne.mockResolvedValue(testUser);
        User.findById.mockResolvedValue(testUser);
        User.create.mockResolvedValue(testUser);
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    describe("generateToken", () => {
        it("should generate a JWT token for a valid user", async () => {
            const token = await AuthService.generateToken(testUser);
            expect(token).toBe("mocked-jwt-token");
        });

        it("should throw an error if token generation fails", async () => {
            require("../../auth/AuthMiddleware").generateJWT = jest
                .fn()
                .mockImplementation(() => {
                    throw new Error("Token generation failed");
                });
            await expect(
                AuthService.generateToken({ _id: "throw" })
            ).rejects.toThrow("Error generating token");
        });
    });

    describe("login", () => {
        it("should log in with valid credentials", async () => {
            const result = await AuthService.login({
                email: testUser.email,
                password: "password123",
            });

            expect(result.token).toBeDefined();
            expect(result.user).toBeDefined();
        });

        it("should throw an error for invalid email", async () => {
            const UserService = require("../../users/UserService");
            // Mock findUserByEmail to return null for invalid email
            UserService.findUserByEmail.mockResolvedValue(null);

            await expect(
                AuthService.login({
                    email: "wrong@example.com",
                    password: "password123",
                })
            ).rejects.toThrow("Invalid credentials");
        });

        it("should throw an error for incorrect password", async () => {
            testUser.comparePassword.mockResolvedValue(false);

            await expect(
                AuthService.login({
                    email: testUser.email,
                    password: "wrongPassword",
                })
            ).rejects.toThrow("Invalid credentials");
        });
    });

    describe("initiatePasswordReset", () => {
        it("should initiate password reset for valid email", async () => {
            const resetToken = "test-reset-token";
            const hashedToken = crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

            testUser.resetPasswordToken = hashedToken;
            testUser.resetPasswordExpires = Date.now() + 3600000;

            // Mock successful update
            User.findByIdAndUpdate.mockResolvedValue(testUser);

            await expect(
                AuthService.initiatePasswordReset(testUser.email)
            ).resolves.not.toThrow();
        });

        it("should not throw an error if email is not found", async () => {
            User.findOne.mockResolvedValue(null);

            await expect(
                AuthService.initiatePasswordReset("nonexistent@example.com")
            ).resolves.not.toThrow();
        });

        it("should revert token if email fails", async () => {
            const emailService = require("../../utils/emailService");
            const UserService = require("../../users/UserService");

            // Mock successful user lookup
            UserService.findUserByEmail.mockResolvedValue(testUser);

            // Mock failed email
            emailService.sendPasswordReset.mockRejectedValue(
                new Error("Email failed")
            );

            await expect(
                AuthService.initiatePasswordReset(testUser.email)
            ).rejects.toThrow("Failed to send password reset email");

            // Verify token was reverted
            expect(UserService.updateUser).toHaveBeenCalledWith(testUser._id, {
                resetPasswordToken: null,
                resetPasswordExpires: null,
            });
        });
    });

    describe("resetPassword", () => {
        it("should reset password with a valid token", async () => {
            // Create a hashed token that matches what's in the database
            const resetToken = "valid-token";
            const hashedToken = crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

            // Mock user with matching hashed token
            const mockUser = {
                _id: "user123",
                resetPasswordToken: hashedToken,
                resetPasswordExpires: Date.now() + 3600000, // 1 hour from now
                save: jest.fn().mockResolvedValue(true),
            };

            // Mock User.findOne to return our mock user
            User.findOne.mockResolvedValue(mockUser);

            const result = await AuthService.resetPassword(
                resetToken,
                "newPassword123"
            );

            expect(result).toBeTruthy();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it("should throw an error if the token is invalid or expired", async () => {
            User.findOne.mockResolvedValue(null);

            await expect(
                AuthService.resetPassword("invalid-token", "newPassword123")
            ).rejects.toThrow("Invalid or expired reset token");
        });
    });

    describe("validateToken", () => {
        it("should throw an error for an invalid token", async () => {
            const invalidToken = "invalid-token";
            await expect(
                AuthService.validateToken(invalidToken)
            ).rejects.toThrow("Invalid token");
        });
    });
});
