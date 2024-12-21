// src/products/tests/ProductModel.test.js
const mongoose = require("mongoose");
const { ProductModel } = require("../ProductModel"); // Import the Product model
const { MongoMemoryServer } = require("mongodb-memory-server"); // In-memory MongoDB for testing

let mongoServer;

// Setup MongoDB in-memory server before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

// Close the connection and stop the in-memory server after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Product Model Test", () => {
    it("should create a product with valid data", async () => {
        const validProduct = new ProductModel({
            name: "Vinyl Record",
            price: 29.99,
            type: "vinyl",
            stock: 100,
        });

        const savedProduct = await validProduct.save();

        expect(savedProduct).toHaveProperty("_id"); // Check if _id is created
        expect(savedProduct.name).toBe("Vinyl Record");
        expect(savedProduct.price).toBe(29.99);
        expect(savedProduct.type).toBe("vinyl");
        expect(savedProduct.stock).toBe(100);
    });

    it("should fail to create a product without a name", async () => {
        const invalidProduct = new ProductModel({
            price: 29.99,
            type: "vinyl",
            stock: 100,
        });

        let error;
        try {
            await invalidProduct.save();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined(); // Error should be thrown
        expect(error.errors.name).toBeDefined(); // 'name' field should trigger validation error
    });

    it("should fail to create a product with a negative price", async () => {
        const invalidProduct = new ProductModel({
            name: "Vinyl Record",
            price: -5,
            type: "vinyl",
            stock: 100,
        });

        let error;
        try {
            await invalidProduct.save();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined(); // Error should be thrown
        expect(error.errors.price).toBeDefined(); // 'price' field should trigger validation error
    });

    it("should fail to create a product with an invalid type", async () => {
        const invalidProduct = new ProductModel({
            name: "Vinyl Record",
            price: 29.99,
            type: "invalidType", // Invalid type that is not part of the enum
            stock: 100,
        });

        let error;
        try {
            await invalidProduct.save();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined(); // Error should be thrown
        expect(error.errors.type).toBeDefined(); // 'type' field should trigger validation error
    });
});
