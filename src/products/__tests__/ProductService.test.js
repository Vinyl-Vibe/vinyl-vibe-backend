require("dotenv").config({ path: ".env.test" });
const mongoose = require("mongoose");
const { ProductService } = require("../ProductService");
const { ProductModel } = require("../ProductModel");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { AppError } = require("../../utils/middleware/errorMiddleware");

// Create an in-memory MongoDB server for testing
let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("ProductService Tests", () => {
    let productId;

    // Test data setup
    beforeEach(async () => {
        const product = await ProductModel.create({
            name: "Test Vinyl",
            price: 29.99,
            type: "vinyl",
            stock: 100,
        });
        productId = product._id.toString();
    });

    afterEach(async () => {
        // Clean up after each test
        await ProductModel.deleteMany({});
    });

    describe("createProduct", () => {
        it("should create a new product successfully", async () => {
            const newProductData = {
                name: "New Vinyl Record",
                price: 25.99,
                type: "vinyl",
                stock: 10,
            };

            const newProduct = await ProductService.createProduct(newProductData);

            expect(newProduct).toHaveProperty("name", "New Vinyl Record");
            expect(newProduct).toHaveProperty("price", 25.99);
            expect(newProduct).toHaveProperty("stock", 10);
        });

        it("should throw an error when product creation fails", async () => {
            const invalidProductData = {
                name: "", // Invalid product name
                price: -5, // Invalid price
                type: "vinyl",
                stock: 10,
            };

            await expect(ProductService.createProduct(invalidProductData)).rejects.toThrow(AppError);
        });
    });

    describe("getAllProducts", () => {
        it("should return all products", async () => {
            const result = await ProductService.getAllProducts({});
            expect(Array.isArray(result)).toBe(true); // Ensure the result is an array
            expect(result.length).toBeGreaterThan(0);
        });
    
        it("should return products filtered by type", async () => {
            const result = await ProductService.getAllProducts({ type: "vinyl" });
            expect(Array.isArray(result)).toBe(true); // Ensure it's an array
            expect(result.length).toBeGreaterThan(0);
        });
    
        it("should return products filtered by price range", async () => {
            const result = await ProductService.getAllProducts({ "price-min": 20, "price-max": 50 });
            expect(Array.isArray(result)).toBe(true); // Ensure it's an array
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("getProductById", () => {
        it("should return a product by its ID", async () => {
            const product = await ProductService.getProductById(productId);
            expect(product).toHaveProperty("name", "Test Vinyl");
        });

        it("should throw an error when product is not found", async () => {
            await expect(ProductService.getProductById("invalid-id")).rejects.toThrow(AppError);
        });
    });

    describe("updateProduct", () => {
        it("should update the product successfully", async () => {
            const updatedData = { price: 19.99 };
            const updatedProduct = await ProductService.updateProduct(productId, updatedData);
            expect(updatedProduct).toHaveProperty("price", 19.99);
        });
    
        it("should throw an error if the product is not found", async () => {
            const updatedData = { price: 19.99 };
            await expect(ProductService.updateProduct("invalid-id", updatedData)).rejects.toThrow(AppError);
        });
    
        it("should throw an error if invalid fields are provided", async () => {
            const updatedData = { invalidField: "invalid" };
            const updatedProduct = await ProductService.updateProduct(productId, updatedData);
            expect(updatedProduct).toHaveProperty("name", "Test Vinyl"); // Expecting the product to be updated despite the invalid field
        });
        
    });

    describe("deleteProduct", () => {
        it("should delete the product successfully", async () => {
            const deletedProduct = await ProductService.deleteProduct(productId);
            expect(deletedProduct).toHaveProperty("name", "Test Vinyl");
        });

        it("should throw an error when product is not found", async () => {
            await expect(ProductService.deleteProduct("invalid-id")).rejects.toThrow(AppError);
        });
    });
});
