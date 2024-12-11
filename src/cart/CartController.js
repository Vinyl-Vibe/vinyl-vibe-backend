const CartService = require("./CartService")
const { AppError } = require("../utils/middleware/errorMiddleware")

/**
 * Retrieve the current cart for the authenticated user
 * GET /cart
 */

const getCart = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const cart = await CartService.getCartByUserId(userId);
        
        res.status(200).json({ 
            status: "success", 
            data: cart
        });
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

        // Destructure 'productId' and 'quantity' from the incoming request body
        const { productId, quantity } = req.body;

        // Ensures that 'productId' or 'quantity' are provided.
        if (!productId || !quantity) {
            
            // Throw a 400 Bad Request error handled by errorMiddleware.js
            return next(new AppError("Product ID and quantity are required", 400));
        }

        // See if the userId is already associated with a cart document in the database
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

        // Sends a HTTP response status code 201 when the request is 
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


/**
 * Remove an item from the cart
 * DELETE /cart/:item-id
 */
const removeItem = async (req, res, next) => {
    try {
        
        // Extract the 'itemId' from the route parameters and 'userId' authenticated by the middleware
        const { itemId } = req.params;
        const userId = req.user._id;

        // Fetches the cart associated with that user from the database
        const cart = await CartService.getCartByUserId(userId);

        // Removes the item specified by the 'itemId' from the cart
        // 'removeProductFromCart' throws an error if the product is not in the cart
        const updatedCart = await CartService.removeProductFromCart(cart, itemId);

        // Sends a 200 success response with the updated cart
        res.status(200).json({
            status: "success",
            message: "Product removed from cart",
            data: updatedCart,
        });
    } catch (error) {

        // When an item is not found in the cart, the error message will be:
        // "Product not found in cart"
        if (error.message === "Product not found in cart") {

            // Return a 404 Bad Request from errorMiddleware.js
            return next(new AppError("The specified product does not exist in the cart.", 404));
        }

        // Forward all other unexpected errors to the errorHandler
        next(error);
    }
};


/**
 * Retrieve cart items filtered by user ID
 * GET /cart?user-id=123
 */

const getFilteredCart = async (req, res, next) => {
    try {

        // Extract the 'userId' from the query parameters
        const { "user-id": userId } = req.query;

        // Validate that there is a 'userID' present within the query
        if (!userId) {

            // Throw a 400 Bad Request error if the 'userId' is missing
            return next(new AppError("User ID is required for filtering", 400));
        }

        // Fetch the cart associated with the 'userId' provided
        const cart = await CartService.getCartByUserId(userId);
        
        // Sends a 200 success response with the updated cart
        res.status(200).json({ 
            status: "success", 
            data: cart,
        });

    // Foreard any errors to the errorHandler middleware
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addItem,
    updateItemQuantity,
    removeItem,
    getFilteredCart
}