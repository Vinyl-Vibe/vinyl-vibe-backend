const { CartModel } = require("./CartModel")
const { ProductModel } = require("../products/ProductModel")
const { AppError } = require("../utils/middleware/errorMiddleware")

/**
 * Retrieve the user's existing cart.
 * Throws an error if no cart is found.
 * @param {String} userId - The ID of the authenticated user.
 * @returns {Object} - The user's cart.
 */

const getCartByUserId = async (userId) => {
    // Serch the database for a cart doument associated with the authenticated userId,
    // 'populate' fetches and returns the full product details to the 'products' array
    const cart = await CartModel.findOne({ userId }).populate("products.productId");
    
    // Throw a 404 error if no cart is found for that given userId
    if (!cart) {
        throw new AppError("Cart not found", 404);
    }

    // if a cart is found, return the cart object with populated product details
    return cart;
};

/**
 * Create a new cart for a user.
 * Throws an error if cart creation fails.
 * @param {String} userId - The ID of the authenticated user.
 * @param {Array} products - The products to add to the new cart.
 * @returns {Object} - The newly created cart.
 */

const createCart = async (userId, products) => {
    // Creates a new cart document using the 'CartModel' schema and store it in 'cart'
    // userId is also added to the document.
    const cart = new CartModel({ userId, products });

    // Saves the 'cart' to the database and stores the results in 'savedCart'.
    const savedCart = await cart.save();

    // Throw a 500 error if the opperation fails
    if (!savedCart) {
        throw new AppError("Failed to create cart", 500);
    }

    // If 'savedCart' exists, return it. 
    return savedCart;
};

/**
 * Add or update products in the user's cart.
 * Throws an error if the cart cannot be updated.
 * @param {Object} cart - The user's existing cart.
 * @param {Array} products - An array of products to add or update.
 * @returns {Object} - The updated cart.
 */

const addOrUpdateProducts = async (cart, products) => {
    // Validate products exist before adding
    for (const newProduct of products) {
        const productExists = await ProductModel.findById(newProduct.productId);
        if (!productExists) {
            throw new AppError(`Product ${newProduct.productId} not found`, 404);
        }
        
        // Check stock levels
        if (productExists.stock < newProduct.quantity) {
            throw new AppError(
                `Insufficient stock for ${productExists.name}. Available: ${productExists.stock}`,
                400
            );
        }
    }
    
    // Iterates over the array of incoming products to update the cart
    for (const newProduct of products) {

        // Searches for a matching product in the existing 'products' array
        const existingProduct = cart.products.find(
            
            // Converts the existing productId (ObjectId) to a string 
            // so it can be compared with the incoming productId (string)
            (item) => item.productId.toString() === newProduct.productId
        );

        // If the product already exists in the cart, update its quantity
        if (existingProduct) {
            existingProduct.quantity += newProduct.quantity; 

        // If the product doesn't exist, add it to the cart
        } else {
            cart.products.push(newProduct);
        }
    }

    // sends the updated card to MongoDB
    const updatedCart = await cart.save();
    
    // if the save option doesn't work, throw a 500 error
    if (!updatedCart) {
        throw new AppError("Failed to update cart", 500);
    }
    return updatedCart;
};

/**
 * Remove a product from the user's cart.
 * Throws an error if the product cannot be removed.
 * @param {Object} cart - The user's existing cart.
 * @param {String} productId - The ID of the product to remove.
 * @returns {Object} - The updated cart after removal.
 */

const removeProductFromCart = async (cart, productId) => {
    
    // Determines the number of objects in the cart initially
    const initialLength = cart.products.length;

// Filters out the product with the matching 'productId' from the cart's products array
    cart.products = cart.products.filter(

        // Converts the existing 'productId' from and ObjectId to a string so it can be
        // compared to the input 'productId'
        (item) => item.productId.toString() !== productId
    );

    // If the number of products in the cart now matches the inital length, 
    // throw a 404 error. The product was not in the cart to begin with
    if (cart.products.length === initialLength) {
        throw new AppError("Product not found in cart", 404);
    }

    // Sends the updated cart to the database
    const updatedCart = await cart.save();
    return updatedCart;
};

/**
 * Clear all products from the user's cart.
 * Throws an error if the cart cannot be cleared.
 * @param {Object} cart - The user's existing cart.
 * @returns {Object} - The empty cart.
 */

const clearCart = async (cart) => {
    
    // Set the cars products array to an empty array
    cart.products = [];

    // Saves the updated empty cart to the database
    const clearedCart = await cart.save();

    // If saving fails, throw a 500 error to indicate an internal server issue
    if (!clearedCart) {
        throw new AppError("Failed to clear cart", 500);
    }

    // Return the cleared cart with an empty products array
    return clearedCart;
};

/**
 * Calculate the total price of the cart.
 * Assumes each product has a 'price' field in its populated details.
 * @param {Object} cart - The user's cart with populated product details.
 * @returns {Number} - The total price of the cart.
 */

const calculateCartTotal = (cart) => {

    // Short-circuit logic to determin that there is something in the cart
    if (!cart.products || cart.products.length === 0) {
        
        // If the products array is empty, throw a 400 error
        throw new AppError("Cart is empty", 400);
    }

    // Iterates over the products array in the cart to find the price of each item
    return cart.products.reduce((total, item) => {
        
        // Checks that each item has a valid price entered
        if (!item.productId.price) {
            // Throws a 400 error when a price is missing
            throw new AppError("Product price is missing", 400);
        }

        // Add the product's total price (price * quantity) to the running total
        return total + item.productId.price * item.quantity;
        
    // Initilaises the total as 0
    }, 0);
};

module.exports = {
    getCartByUserId,
    createCart,
    addOrUpdateProducts,
    removeProductFromCart,
    clearCart,
    calculateCartTotal,
};
