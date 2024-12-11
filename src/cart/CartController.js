const CartService = require("./CartService")
const { AppError } = require("../utils/middleware/errorMiddleware")

/**
 * Retrieve the current cart for the authenticated user
 * GET /cart
 */

const getCart = async (req, res, next) => {
    try {

        // Extracts the 'userId' validated and attached to req.user by 'authMiddleware.js'
        const userId = req.user._id;

        // Fetches the cart assicociated with the 'userId' from the database
        // Waits for a response from the 'getCartByUserId' function in 'CartService.js'
        const cart = await CartService.getCartByUserId(userId);

        // Sends a HTTP response of '200 OK' when the request is successful
        // adds "status": "success", to the JSON response body
        res.status(200).json({ 
            status: "success", 
            data: cart, 
        });

        // Catches any errors not and passes them to the errorHandler
    } catch (error) {
        next(error);
    }
};

/**
 * Add a new item to the cart
 * POST /cart
 */

const addItem = async (req, res, next) => {
    try {

        // Extracts the 'userId' validated and attached to req.user by 'authMiddleware.js'
        const userId = req.user._id;

        // Destructures 'productId' and 'quantity' from the incoming request body
        const { productId, quantity } = req.body;

        // Ensures that 'productId' or 'quantity' are provided.
        if (!productId || !quantity) {
            
            // Throw a 400 Bad Request error handled by errorMiddleware.js
            return next(new AppError("Product ID and quantity are required", 400));
        }

        // See if the userId is already associadted with a cart document in the database
        // If no cart exists, 'cart' is set to null.
        let cart = await CartService.getCartByUserId(userId).catch(() => null);

        // Add or update products in the cart
        // - If 'cart' exists, update the cart
        // - If 'cart' doesn't exist, create a new cart with the product
        const updatedCart = cart
            // Update existing cart
            ? await CartService.addOrUpdateProducts(cart, [{ productId, quantity }])
            // Creates a new cart 
            : await CartService.createCart(userId, [{ productId, quantity }]);

        // Sends a HTTP response staus code 201 when the request is 
        // successfully created or updated
        res.status(201).json({ 
            status: "success", 
            data: updatedCart,
        });

    // Foreard any errors to the errorHandler middleware
    } catch (error) {
        next(error);
    }
};



module.exports = {
    getCart,
    addItem,
}