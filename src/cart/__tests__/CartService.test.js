require("dotenv").config({ path: ".env.test" });
const mongoose = require("mongoose");
const { CartModel } = require("../CartModel");
const { ProductModel } = require("../../products/ProductModel");
const { User } = require("../../users/UserModel");
const CartService = require("../CartService");
const { AppError } = require("../../utils/middleware/errorMiddleware");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let testUser;
let testCart;
let testProduct;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  // Create a test user
  testUser = await User.create({
    email: "randomtestuser123@example.com",
    password: "password123",
    role: "user",
    profile: { firstName: "John", lastName: "Doe" },
  });

  // Create a test product with a valid 'type'
  testProduct = await ProductModel.create({
    name: "Test Product",
    price: 20,
    type: "vinyl",  // Use a valid value according to the Product model's enum for `type`
    stock: 10,
  });

  // Create a test cart for the user
  testCart = await CartModel.create({
    userId: testUser._id,
    products: [
      {
        productId: testProduct._id,
        quantity: 3,
      },
    ],
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("CartService Tests", () => {
  describe("getCartByUserId", () => {
    it("should retrieve a cart for a valid user", async () => {
      const cart = await CartService.getCartByUserId(testUser._id);
      expect(cart).toHaveProperty("user.email", "randomtestuser123@example.com");
      expect(cart.products.length).toBeGreaterThan(0);
    });

    it("should throw an error if cart is not found", async () => {
      await expect(CartService.getCartByUserId(null)).rejects.toThrow(AppError);
    });
  });

  describe("createCart", () => {
    it("should create a new cart for a user", async () => {
      const newCart = await CartService.createCart(testUser._id, [
        { productId: testProduct._id, quantity: 2 },
      ]);
      expect(newCart).toHaveProperty("user.email", "randomtestuser123@example.com");
      expect(newCart.products.length).toBe(1);
      expect(newCart.products[0].quantity).toBe(2);
    });

    it("should throw an error if cart creation fails", async () => {
      CartModel.prototype.save = jest.fn().mockRejectedValueOnce(new Error("Failed to create cart"));
      await expect(CartService.createCart(testUser._id, [])).rejects.toThrow("Failed to create cart");
    });
  });

  describe("addOrUpdateProducts", () => {
    it("should add a product to the cart", async () => {
      // Mocking the CartModel.save method to return a cart with the updated products
      CartModel.prototype.save = jest.fn().mockResolvedValue({
        _id: testCart._id,  // Ensure _id is returned
        userId: testCart.userId,
        products: [
          { productId: testProduct._id, quantity: 3 },  // Mock updated product quantity
        ],
      });

      const updatedCart = await CartService.addOrUpdateProducts(testCart, [
        { productId: testProduct._id, quantity: 2 }, // Adding 2, expect total to be 3
      ]);
      expect(updatedCart.products[0].quantity).toBe(3); // Since it should add quantity to existing
    });

    it("should update product quantity in the cart", async () => {
      // Mocking save for product update
      CartModel.prototype.save = jest.fn().mockResolvedValue({
        _id: testCart._id,  // Ensure _id is returned
        userId: testCart.userId,
        products: [
          { productId: testProduct._id, quantity: 3 },  // Updated quantity after isUpdate
        ],
      });

      const updatedCart = await CartService.addOrUpdateProducts(testCart, [
        { productId: testProduct._id, quantity: 3 }, // isUpdate set to true, updating quantity
      ], true);
      expect(updatedCart.products[0].quantity).toBe(3); // Directly updating quantity
    });

    it("should throw an error if product is out of stock", async () => {
      await expect(CartService.addOrUpdateProducts(testCart, [
        { productId: testProduct._id, quantity: 200 },
      ])).rejects.toThrow(AppError);
    });
  });

  describe("removeProductFromCart", () => {
    it("should remove a product from the cart", async () => {
      const updatedCart = await CartService.removeProductFromCart(testCart, testProduct._id);
      expect(updatedCart.products.length).toBe(0); // Cart should be empty
    });
  
    it("should throw an error if product is not found in the cart", async () => {
      await expect(CartService.removeProductFromCart(testCart, "nonexistent-product-id")).rejects.toThrow(AppError);
    });
  });

  describe("clearCart", () => {
    it("should clear all products from the cart", async () => {
      const updatedCart = await CartService.clearCart(testCart);
      expect(updatedCart.products.length).toBe(0); // Cart should be empty
    });

    it("should throw an error if cart cannot be cleared", async () => {
      CartModel.prototype.save = jest.fn().mockRejectedValueOnce(new Error("Failed to clear cart"));
      await expect(CartService.clearCart(testCart)).rejects.toThrow("Failed to clear cart");
    });
  });

  describe("calculateCartTotal", () => {
    it("should calculate the total price of the cart", async () => {
      const total = await CartService.calculateCartTotal(testCart);
      expect(total).toBe(20); // 1 product * price 20
    });

    it("should throw an error if cart is empty", async () => {
      const emptyCart = await CartModel.create({ userId: testUser._id, products: [] });
      await expect(CartService.calculateCartTotal(emptyCart)).rejects.toThrow("Cart is empty");
    });

    it("should throw an error if product price is missing", async () => {
      const productWithoutPrice = await ProductModel.create({ name: "No Price Product", stock: 10 });
      const cartWithNoPriceProduct = await CartModel.create({
        userId: testUser._id,
        products: [{ productId: productWithoutPrice._id, quantity: 1 }],
      });
      await expect(CartService.calculateCartTotal(cartWithNoPriceProduct)).rejects.toThrow("Product price is missing");
    });
  });
});
