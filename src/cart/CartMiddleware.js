const jwt = require("jsonwebtoken");
const { CartModel } = require("./CartModel")
const { User } = require("../users/UserModel")

// Middleware to check if the user is authenticated using JWT
// This short-circuit logic is to check whether or not there is a Bearer Token in the Authorization header
const isAuthenticated = (req, res, next) => {
    const token = req.header("Authorization"); // Expecting 'Bearer <token>'
    if (!token) { 
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        // Verify the JWT and decode the payload
        //  This will check that the JWT was:
        // - Signed with the correct JWT_SECRET_KEY
        // - Has not been tampered with
        // - Has not expired
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET_KEY);
        
        // Attach the decoded payload to the request object
        req.user = decoded; 
        next();
    } catch (error) {
        // If the token is invalid (e.g, tampered with, expired, or incorrect signature), an error is thrown
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

// Middleware to validate the cart data in the request body
// Short-circuit logic to make sure the cart contains some valid data
const validateCartData = (req, res, next) => {
    const { products } = req.body;

    // Check the following:
    // - there is a 'products' object
    // - 'products' is an array
    // - 'products' contains at aleast one item
     
    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: "Cart must have at least one product" });
    }

    // Iterate through each entry in the 'products' array
    // Error will be thrown if:
    // - a product has no 'productId', 
    // - a product has no 'quantitiy',
    // - the value of 'quantity' is less than 1 
    for (const item of products) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
            return res
                .status(400)
                .json({ message: "Each product must have a valid productId and quantity >= 1" });
        }
    }
    next();
};

// Middleware to fetch an existing cart for the authenticated user
// This checks if the user has a cart from a pervious visit stored in the database
const fetchUserCart = async (req, res, next) => {
    try {
        // This gets the JWT payload from 'isAuthenticated' above
        // 'req.user._id' is the unique identifier for the user in MongoDB
        const userId = req.user._id; 

        // Queries the database to find the first cart document where 'userId' matches the current user
        // 'populate' replaces the 'productId' field with the actual product details (name, price)
        const cart = await CartModel.findOne({ userId }).populate("products.productId");

        if (!cart) {
            // If there is no existing cart found, req.cart is set to null
            req.cart = null; 
        } else {
            // If a cart is found, attach it to req.cart for downstream usage
            req.cart = cart; 
        }
        next();

        // Handles errors, such as databse connection issues or unexpected failures.  
    } catch (error) {
        res.status(500).json({ message: "Error fetching cart", error: error.message });
    }
};

// Middleware to verify if the authenticated user exists
// This is to ensure: 
// - user account is valid
// - user account hasn't been deleted after the JWT was issued
// - user record still exists and hasn't been removed accidentally
const checkUserExists = async (req, res, next) => {
    try {
        // Extracts the 'userId' from the JWT payload
        // 'req.user._id' was set by the 'isAuthenticated' middleware,
        // therefore, 'isAuthenticated' must run before 'checkUserExists'
        const userId = req.user._id; 
        
        // Query the database to find a user document with the matching '_id'.
        const user = await User.findById(userId);

        // Throw error is the user does not exist
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        next();

        // Handles errors, such as databse connection issues or unexpected failures.  
    } catch (error) {
        res.status(500).json({ message: "Error verifying user", error: error.message });
    }
};

module.exports = {
    isAuthenticated,
    validateCartData,
    fetchUserCart,
    checkUserExists,
};