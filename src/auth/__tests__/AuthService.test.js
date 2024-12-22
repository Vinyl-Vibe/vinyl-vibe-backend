require("dotenv").config({ path: ".env.test" });
const mongoose = require("mongoose");
const { User } = require("../../users/UserModel");
const AuthService = require("../../auth/AuthService");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");
const { AppError } = require("../../utils/middleware/errorMiddleware");
const crypto = require("crypto");

// Mock generateJWT from AuthMiddleware
jest.mock("../../auth/AuthMiddleware", () => ({
  generateJWT: jest.fn().mockImplementation((userId, email, role) => {
    if (userId === "throw") {
      throw new Error("Token generation failed");
    }
    return "mocked-jwt-token";
  })
}));

// Mock sendPasswordReset from emailService
jest.mock("../../utils/emailService", () => ({
  sendPasswordReset: jest.fn().mockResolvedValue(true)
}));

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
      expect(token).toBe("mocked-jwt-token");
    });

    it("should throw an error if token generation fails", async () => {
      require("../../auth/AuthMiddleware").generateJWT = jest.fn().mockImplementation(() => {
        throw new Error("Token generation failed");
      });
      await expect(AuthService.generateToken({ _id: "throw" })).rejects.toThrow("Error generating token");
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
      const sendEmailMock = jest.spyOn(require("../../utils/emailService"), "sendPasswordReset").mockRejectedValue(new Error("Email send failed"));
      await expect(AuthService.initiatePasswordReset(email)).rejects.toThrow("Failed to send password reset email");
      sendEmailMock.mockRestore();
    });
  });

  describe("resetPassword", () => {
    it("should reset password with a valid token", async () => {
      const resetToken = "valid-reset-token";
      const newPassword = "newPassword123";
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Ensure the token is set in the database for testing
      await User.updateOne({ _id: testUser._id }, { resetPasswordToken: hashedToken });

      // Perform the reset password action
      await AuthService.resetPassword(resetToken, newPassword);

      // Check if the password is updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.password).not.toBe(testUser.password);
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
