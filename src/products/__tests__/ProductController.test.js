// Load environment variables first
require("dotenv").config({ path: ".env.test" });

const request = require("supertest");
const { app } = require("../../server");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const { createTestUser } = require("../../__tests__/helpers");
const { ProductModel } = require("../ProductModel");

// Mock cloudinary uploader directly, with the correct path
jest.mock("../../utils/cloudinary/index", () => ({
    uploader: {
        destroy: jest.fn().mockResolvedValue({ result: "ok" }), // Mocked response
    },
}));

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Product Controller Tests", () => {
    let adminUser, adminToken, regularUser, userToken;

    beforeEach(async () => {
        // Create test users
        ({ user: adminUser, token: adminToken } = await createTestUser("admin"));
        ({ user: regularUser, token: userToken } = await createTestUser("user"));

        // Create a test product
        await ProductModel.create({
            name: "Test Vinyl",
            price: 29.99,
            type: "vinyl",
            stock: 100,
        });
    });

    afterEach(async () => {
        // Clean up after each test
        await ProductModel.deleteMany({});
    });

    // Test for creating a product
    describe("POST /products", () => {
        it("should create a product with valid admin token", async () => {
            const newProduct = {
                name: "New Vinyl Record",
                price: 25.99,
                type: "vinyl",
                stock: 10,
            };

            const res = await request(app)
                .post("/products")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(newProduct);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.product.name).toBe("New Vinyl Record");
        });

        it("should return 403 if non-admin user tries to create a product", async () => {
            const newProduct = {
                name: "New Vinyl Record",
                price: 25.99,
                type: "vinyl",
                stock: 10,
            };

            const res = await request(app)
                .post("/products")
                .set("Authorization", `Bearer ${userToken}`)
                .send(newProduct);

            expect(res.status).toBe(403);
        });
    });

    // Test for getting all products
    describe("GET /products", () => {
        it("should return all products", async () => {
            const res = await request(app).get("/products");
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.products)).toBe(true);
        });
    });

    // Test for getting a single product by ID
    describe("GET /products/:id", () => {
        it("should return a product by ID", async () => {
            const product = await ProductModel.findOne();
            const res = await request(app).get(`/products/${product._id}`);
            expect(res.status).toBe(200);
            expect(res.body.product).toHaveProperty('name');
        });

        it("should return 404 for a non-existing product", async () => {
            const res = await request(app).get("/products/invalid-id");
            expect(res.status).toBe(404);
        });
    });

    // Test for updating a product
    describe("PATCH /products/:id", () => {
        it("should update a product with valid data", async () => {
            const product = await ProductModel.findOne();
            const updatedData = { price: 19.99 };

            const res = await request(app)
                .patch(`/products/${product._id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send(updatedData);

            expect(res.status).toBe(200);
            expect(res.body.product.price).toBe(19.99);
        });

        it("should return 403 for non-admin users", async () => {
            const product = await ProductModel.findOne();
            const updatedData = { price: 19.99 };

            const res = await request(app)
                .patch(`/products/${product._id}`)
                .set("Authorization", `Bearer ${userToken}`)
                .send(updatedData);

            expect(res.status).toBe(403);
        });
    });

    // Test for deleting a product
    describe("DELETE /products/:id", () => {
        it("should delete a product with valid admin token", async () => {
            const product = await ProductModel.findOne();

            const res = await request(app)
                .delete(`/products/${product._id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it("should return 403 for non-admin users", async () => {
            const product = await ProductModel.findOne();

            const res = await request(app)
                .delete(`/products/${product._id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });
    });

    // Mock cloudinary to test image deletion (if needed in your routes)
    describe("DELETE /products/images/:publicId", () => {
        it("should delete the product image", async () => {
            cloudinary.uploader.destroy.mockResolvedValue({ result: "ok" });
            
            const res = await request(app)
                .delete("/products/images/sample-id")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Image deleted successfully");
        });

        it("should handle image deletion failure", async () => {
            cloudinary.uploader.destroy.mockRejectedValue(new Error("Error"));

            const res = await request(app)
                .delete("/products/images/sample-id")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(500);
            expect(res.body.message).toBe("Failed to delete image: Error");
        });
    });
});
