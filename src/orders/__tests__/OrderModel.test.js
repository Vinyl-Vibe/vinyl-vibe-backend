// src/orders/__tests__/OrderModel.test.js
const mongoose = require("mongoose");
const { OrderModel } = require("../OrderModel"); // Import the Order model
const { MongoMemoryServer } = require("mongodb-memory-server"); // In-memory MongoDB for testing

let mongoServer;

// Setup MongoDB in-memory server before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

// Close the connection and stop the in-memory server after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Order Model Test", () => {
    it("should create an order with valid data", async () => {
        const validOrder = new OrderModel({
            userId: new mongoose.Types.ObjectId(),
            products: [
                {
                    productId: new mongoose.Types.ObjectId(),
                    quantity: 2,
                    price: 29.99,
                },
            ],
            total: 59.98,
            shippingAddress: {
                street: "123 Test St",
                city: "Test City",
                postcode: "12345",
                state: "Test State",
                country: "Test Country",
            },
        });

        const savedOrder = await validOrder.save();
        expect(savedOrder._id).toBeDefined();
    });

    it("should fail to create an order with missing required fields", async () => {
        const invalidOrder = new OrderModel({});

        let validationError;
        try {
            await invalidOrder.validate();
        } catch (error) {
            validationError = error;
        }

        expect(validationError).toBeDefined();
        expect(validationError.errors).toBeDefined();

        // Log the actual errors to see their structure
        console.log(
            "Validation errors:",
            JSON.stringify(validationError.errors, null, 2)
        );

        // Check for required field errors
        const errors = validationError.errors;
        expect(errors).toHaveProperty("userId");
        expect(errors).toHaveProperty("total");

        // Check error messages
        expect(errors.userId.kind).toBe("required");
        expect(errors.total.kind).toBe("required");
    });

    it("should fail to create an order with invalid quantity", async () => {
        const invalidOrder = new OrderModel({
            userId: new mongoose.Types.ObjectId(),
            products: [
                {
                    productId: new mongoose.Types.ObjectId(),
                    quantity: -1, // Invalid quantity
                    price: 29.99,
                },
            ],
            total: 59.98,
        });

        let validationError;
        try {
            await invalidOrder.validate();
        } catch (error) {
            validationError = error;
        }

        expect(validationError).toBeDefined();
        expect(validationError.errors["products.0.quantity"]).toBeDefined();
    });

    it('should have a default status of "pending"', async () => {
        const order = new OrderModel({
            userId: new mongoose.Types.ObjectId(),
            products: [
                {
                    productId: new mongoose.Types.ObjectId(),
                    quantity: 1,
                    price: 29.99,
                },
            ],
            total: 29.99,
        });

        expect(order.status).toBe("pending");
    });

    it("should only allow valid status values", async () => {
        const order = new OrderModel({
            userId: new mongoose.Types.ObjectId(),
            products: [
                {
                    productId: new mongoose.Types.ObjectId(),
                    quantity: 1,
                    price: 29.99,
                },
            ],
            total: 29.99,
            status: "invalid_status",
        });

        let validationError;
        try {
            await order.validate();
        } catch (error) {
            validationError = error;
        }

        expect(validationError).toBeDefined();
        expect(validationError.errors.status).toBeDefined();
    });

    it("should calculate createdAt automatically", async () => {
        const order = new OrderModel({
            userId: new mongoose.Types.ObjectId(),
            products: [
                {
                    productId: new mongoose.Types.ObjectId(),
                    quantity: 1,
                    price: 29.99,
                },
            ],
            total: 29.99,
        });

        expect(order.createdAt).toBeDefined();
    });
});
