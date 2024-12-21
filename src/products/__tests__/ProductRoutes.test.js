// Load the .env file for testing
require("dotenv").config({ path: ".env.test" });

// src/products/tests/ProductRoutes.test.js
const request = require("supertest");
const app = require("../../server"); // Import the app from server.js
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongoServer;

// Setup MongoDB in-memory server before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Ensure mongoose connects only once to the test database
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
});

// Close the connection and stop the in-memory server after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Product Routes", () => {
    let adminToken; // Mock admin token
    let userToken; // Mock user token

    // Mock authentication for the routes
    beforeAll(() => {
        adminToken = "mockAdminToken"; // Replace with a valid token if needed
        userToken = "mockUserToken"; // Replace with a valid token if needed
    });

    describe("GET /products", () => {
        it("should return all products", async () => {
            const res = await request(app).get("/products"); // Removed /api
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true); // Should return an array of products
        });
    });

    describe("GET /products/:id", () => {
        it("should return a product by ID", async () => {
            const productId = "12345"; // Simulate a valid product ID
            const res = await request(app).get(`/products/${productId}`); // Removed /api
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("name"); // Assuming 'name' is a field in your product
        });

        it("should return 404 for a non-existing product", async () => {
            const res = await request(app).get("/products/invalid-id"); // Removed /api
            expect(res.status).toBe(404);
        });
    });

    describe("POST /products", () => {
        it("should create a product with valid admin token", async () => {
            const newProduct = {
                name: "New Vinyl Record",
                price: 25.99,
                type: "vinyl",
                stock: 10,
            };

            const res = await request(app)
                .post("/products") // Removed /api
                .set("Authorization", `Bearer ${adminToken}`)
                .send(newProduct);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("name", "New Vinyl Record");
        });

        it("should return 403 if a non-admin user tries to create a product", async () => {
            const newProduct = {
                name: "New Vinyl Record",
                price: 25.99,
                type: "vinyl",
                stock: 10,
            };

            const res = await request(app)
                .post("/products") // Removed /api
                .set("Authorization", `Bearer ${userToken}`)
                .send(newProduct);

            expect(res.status).toBe(403); // Forbidden for non-admin users
        });
    });

    describe("PATCH /products/:id", () => {
        it("should update a product with valid admin token", async () => {
            const updatedProduct = { price: 30.99 };

            const res = await request(app)
                .patch("/products/12345") // Removed /api
                .set("Authorization", `Bearer ${adminToken}`)
                .send(updatedProduct);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("price", 30.99);
        });

        it("should return 403 for non-admin user", async () => {
            const updatedProduct = { price: 30.99 };

            const res = await request(app)
                .patch("/products/12345") // Removed /api
                .set("Authorization", `Bearer ${userToken}`)
                .send(updatedProduct);

            expect(res.status).toBe(403); // Forbidden for non-admin users
        });
    });

    describe("DELETE /products/:id", () => {
        it("should delete a product with valid admin token", async () => {
            const res = await request(app)
                .delete("/products/12345") // Removed /api
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });

        it("should return 403 for non-admin user", async () => {
            const res = await request(app)
                .delete("/products/12345") // Removed /api
                .set("Authorization", `Bearer ${userToken}`);

            expect(res.status).toBe(403); // Forbidden for non-admin users
        });
    });
});
