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
    const cart = await CartModel.findOne({ userId })
        .populate({
            path: 'userId',
            select: 'email _id'
        })
        .populate({
            path: 'products.productId',
            select: 'name price type thumbnail'
        })
        .lean();
    
    if (!cart) {
        throw new AppError("Cart not found", 404);
    }

    // Clean up the response structure
    return {
        _id: cart._id,
        user: {
            id: cart.userId._id,
            email: cart.userId.email
        },
        products: cart.products.map(item => ({
            product: {
                id: item.productId._id,
                name: item.productId.name,
                price: item.productId.price,
                type: item.productId.type,
                thumbnail: item.productId.thumbnail
            },
            quantity: item.quantity
        })),
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
    };
};

/**
 * Create a new cart for a user.
 * Throws an error if cart creation fails.
 * @param {String} userId - The ID of the authenticated user.
 * @param {Array} products - The products to add to the new cart.
 * @returns {Object} - The newly created cart.
 */

const createCart = async (userId, products) => {
    const cart = new CartModel({ 
        userId,
        products 
    });

    const savedCart = await cart.save();
    if (!savedCart) {
        throw new AppError("Failed to create cart", 500);
    }
    
    return formatCartResponse(savedCart._id);
};

/**
 * Add or update products in the user's cart.
 * Throws an error if the cart cannot be updated.
 * @param {Object} cart - The user's existing cart.
 * @param {Array} products - An array of products to add or update.
 * @returns {Object} - The updated cart.
 */

const addOrUpdateProducts = async (cart, products, isUpdate = false) => {
    const cartDoc = await CartModel.findById(cart._id);
    if (!cartDoc) {
        throw new AppError("Cart not found", 404);
    }

    // Validate products exist and check stock before adding
    for (const newProduct of products) {
        const productExists = await ProductModel.findById(newProduct.productId);
        if (!productExists) {
            throw new AppError(`Product ${newProduct.productId} not found`, 404);
        }
        
        const existingProduct = cartDoc.products.find(
            item => item.productId && item.productId.toString() === newProduct.productId.toString()
        );
        
        // For updates, use new quantity directly. For adds, sum existing and new
        const totalQuantity = isUpdate ? 
            newProduct.quantity : 
            (existingProduct?.quantity || 0) + newProduct.quantity;
        
        if (productExists.stock < totalQuantity) {
            throw new AppError(
                `Insufficient stock for ${productExists.name}. Available: ${productExists.stock}`,
                400
            );
        }
    }
    
    // Update cart products
    for (const newProduct of products) {
        const existingProduct = cartDoc.products.find(
            item => item.productId && item.productId.toString() === newProduct.productId.toString()
        );

        if (existingProduct) {
            // Set or add quantity based on operation type
            existingProduct.quantity = isUpdate ? 
                newProduct.quantity : 
                existingProduct.quantity + newProduct.quantity;
        } else {
            cartDoc.products.push(newProduct);
        }
    }

    const updatedCart = await cartDoc.save();
    return formatCartResponse(updatedCart._id);
};

/**
 * Remove a product from the user's cart.
 * Throws an error if the product cannot be removed.
 * @param {Object} cart - The user's existing cart.
 * @param {String} productId - The ID of the product to remove.
 * @returns {Object} - The updated cart after removal.
 */

const removeProductFromCart = async (cart, productId) => {
    const cartDoc = await CartModel.findById(cart._id);
    if (!cartDoc) {
        throw new AppError("Cart not found", 404);
    }

    const productIndex = cartDoc.products.findIndex(
        item => item.productId.toString() === productId
    );

    if (productIndex === -1) {
        throw new AppError("Product not found in cart", 404);
    }

    // Store product info before removal for response
    const removedProduct = cartDoc.products[productIndex];
    cartDoc.products.splice(productIndex, 1);
    
    const updatedCart = await cartDoc.save();
    return formatCartResponse(updatedCart._id);
};

/**
 * Clear all products from the user's cart.
 * Throws an error if the cart cannot be cleared.
 * @param {Object} cart - The user's existing cart.
 * @returns {Object} - The empty cart.
 */

const clearCart = async (cart) => {
    const cartDoc = await CartModel.findById(cart._id);
    if (!cartDoc) {
        throw new AppError("Cart not found", 404);
    }
    
    cartDoc.products = [];
    const clearedCart = await cartDoc.save();
    
    // Return minimal response for cleared cart
    return {
        _id: clearedCart._id,
        user: {
            id: clearedCart.userId,
            email: cart.userId.email // Assuming we have this from population
        },
        products: [], // Empty products array
        createdAt: clearedCart.createdAt,
        updatedAt: clearedCart.updatedAt
    };
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

/**
 * Helper function to format cart response consistently
 * @param {Object} cart - Populated cart document
 * @returns {Object} - Formatted cart response
 */
const formatCartResponse = async (cartId) => {
    const populatedCart = await CartModel.findById(cartId)
        .populate({
            path: 'userId',
            select: 'email _id'
        })
        .populate({
            path: 'products.productId',
            select: 'name price type thumbnail'
        })
        .lean();

    return {
        _id: populatedCart._id,
        user: {
            id: populatedCart.userId._id,
            email: populatedCart.userId.email
        },
        products: populatedCart.products.map(item => ({
            product: {
                id: item.productId._id,
                name: item.productId.name,
                price: item.productId.price,
                type: item.productId.type,
                thumbnail: item.productId.thumbnail
            },
            quantity: item.quantity
        })),
        createdAt: populatedCart.createdAt,
        updatedAt: populatedCart.updatedAt
    };
};

module.exports = {
    getCartByUserId,
    createCart,
    addOrUpdateProducts,
    removeProductFromCart,
    clearCart,
    calculateCartTotal,
};
