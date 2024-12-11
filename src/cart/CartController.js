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

/**
 * Update the quantity of an item in the cart
 * PUT /cart/:item-id
 */

const updateItemQuantity = async (req, res, next) => {
    try {

        // Extract the 'itemId' from the route parameters and the 'quantity' from the request body
        const { itemId } = req.params;
        const { quantity } = req.body;

        // Validate the 'quantity' input
        if (!quantity || quantity < 1) {

            // Return a 400 Bad Request error when the quantity is missing or less than 1
            return next(new AppError("Quantity must be at least 1", 400));
        }

        // Extracts the 'userId' validated and attached to req.user by 'authMiddleware.js'
        const userId = req.user._id;

        // Fetches the cart associated with the 'userId'
        const cart = await CartService.getCartByUserId(userId);

        // Handles the adding or updating of the quantity of the product in the cart
        const updatedCart = await CartService.addOrUpdateProducts(cart, [
            { productId: itemId, quantity },
        ]);


        // Sends a HTTP response staus code 200 when the request is successful
        res.status(200).json({ 
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
    updateItemQuantity
}