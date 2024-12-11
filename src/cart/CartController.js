const CartService = require("./CartService")
const { AppError } = require("../utils/middleware/errorMiddleware")
const { CartModel } = require("./CartModel")

/**
 * Retrieve the current cart for the authenticated user
 * GET /cart
 */

const getCart = async (req, res, next) => {
    try {
        const userId = req.user._id;
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
        // Handle both single product and array of products
        const products = Array.isArray(req.body.products) 
            ? req.body.products 
            : [req.body]; // If single product, wrap it in array

        // Validate product structure
        const isValidProduct = product => 
            product.productId && 
            typeof product.quantity === 'number' && 
            product.quantity > 0;

        if (!products.every(isValidProduct)) {
            throw new AppError(
                "Each product must have a productId and a positive quantity", 
                400
            );
        }

        let cart = await CartModel.findOne({ userId: req.user._id });
        if (!cart) {
            cart = await CartService.createCart(req.user._id, products);
        } else {
            cart = await CartService.addOrUpdateProducts(cart, products);
        }

        res.status(200).json({
            status: "success",
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update the quantity of an item in the cart
 * PUT /cart/:itemId
 */

const updateItemQuantity = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            throw new AppError("Invalid quantity", 400);
        }

        const cart = await CartModel.findOne({ userId: req.user._id });
        if (!cart) {
            throw new AppError("Cart not found", 404);
        }

        // Pass isUpdate=true to set the quantity instead of adding to it
        const updatedCart = await CartService.addOrUpdateProducts(cart, [{
            productId: itemId,
            quantity
        }], true);

        res.status(200).json({
            status: "success",
            data: updatedCart
        });
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
        // Extract the userId (_id from User model) from query parameters
        const { "user-id": userId } = req.query;
        
        if (!userId) {
            return next(new AppError("User ID is required for filtering", 400));
        }

        // userId here should match User model _id
        const cart = await CartService.getCartByUserId(userId);
        
        res.status(200).json({ 
            status: "success", 
            data: cart,
        });
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