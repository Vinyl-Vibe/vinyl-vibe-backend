const CartService = require("./CartService");
const { AppError } = require("../utils/middleware/errorMiddleware");
const { CartModel } = require("./CartModel");

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
            cart: cart,
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
        const isValidProduct = (product) =>
            product.productId &&
            typeof product.quantity === "number" &&
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

        console.log(
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––",
            "\n🛒 An item was added to cart by:",
            req.user?.email || `User ID: ${req.user?._id || "Unknown"}`,
            "\n––––––––––––––––––––––––––––––––––––––––––––––––––––––\n"
        );

        res.status(200).json({
            status: "success",
            cart: cart,
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
        const updatedCart = await CartService.addOrUpdateProducts(
            cart,
            [
                {
                    productId: itemId,
                    quantity,
                },
            ],
            true
        );

        res.status(200).json({
            status: "success",
            cart: updatedCart,
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
        const updatedCart = await CartService.removeProductFromCart(
            cart,
            itemId
        );

        // Sends a 200 success response with the updated cart
        res.status(200).json({
            status: "success",
            message: "Product removed from cart",
            cart: updatedCart,
        });
    } catch (error) {
        // When an item is not found in the cart, the error message will be:
        // "Product not found in cart"
        if (error.message === "Product not found in cart") {
            // Return a 404 Bad Request from errorMiddleware.js
            return next(
                new AppError(
                    "The specified product does not exist in the cart.",
                    404
                )
            );
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
            cart: cart,
        });
    } catch (error) {
        next(error);
    }
};

// Add new controller for getting all carts
const getAllCarts = async (req, res, next) => {
    try {
        const carts = await CartModel.find()
            .populate({
                path: "userId",
                select: "email _id",
            })
            .populate({
                path: "products.productId",
                select: "name price type thumbnail",
            })
            .lean();

        const formattedCarts = carts.map((cart) => ({
            _id: cart._id,
            user: cart.userId
                ? {
                      id: cart.userId._id,
                      email: cart.userId.email,
                  }
                : {
                      id: "unknown",
                      email: "Unknown User",
                  },
            products: cart.products.map((item) => ({
                product: item.productId
                    ? {
                          id: item.productId._id,
                          name: item.productId.name,
                          price: item.productId.price,
                          type: item.productId.type,
                          thumbnail: item.productId.thumbnail,
                      }
                    : {
                          id: "unknown",
                          name: "Unknown Product",
                          price: 0,
                          type: "unknown",
                          thumbnail: null,
                      },
                quantity: item.quantity,
            })),
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
        }));

        res.status(200).json({
            status: "success",
            carts: formattedCarts,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllCarts,
    getCart,
    addItem,
    updateItemQuantity,
    removeItem,
    getFilteredCart,
};
