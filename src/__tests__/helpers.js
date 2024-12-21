const jwt = require("jsonwebtoken");
const { User } = require("../users/UserModel");

const generateTestToken = (user) => {
    return jwt.sign(
        {
            _id: user._id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
};

const createTestUser = async (role = "user") => {
    const user = await User.create({
        email: `test-${Date.now()}@example.com`,
        password: "password123",
        role,
    });
    const token = generateTestToken(user);
    return { user, token };
};

module.exports = {
    generateTestToken,
    createTestUser,
};
