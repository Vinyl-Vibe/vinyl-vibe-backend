const jwt = require("jsonwebtoken");

const jwtSecretKey = process.env.JWT_SECRET_KEY;

if (!jwtSecretKey) {
  throw new Error("JWT_SECRET_KEY is not defined in the environment variables");
}

// Function to generate a JWT
function generateJWT(userId, username, roles = null) {
  return jwt.sign(
    {
      userId,
      username,
      roles,
    },
    jwtSecretKey,
    { expiresIn: "7d" }
  );
}

// Function to decode a JWT
function decodeJWT(tokenToDecode) {
  try {
    return jwt.verify(tokenToDecode, jwtSecretKey);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}

// Middleware to validate the JWT in incoming requests
function validateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Authentication token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = decodeJWT(token);
    req.user = decoded; // Attach decoded token data to the request object
    next(); // Pass control to the next middleware or route handler
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// Export all functions
module.exports = {
  generateJWT,
  decodeJWT,
  validateJWT,
};