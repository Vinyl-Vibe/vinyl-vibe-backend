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



module.exports = {
    getCart,
}