// Load environment variables first
require("dotenv").config({ path: ".env.test" });

const request = require("supertest");
const { app } = require("../../server");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const { createTestUser } = require("../../__tests__/helpers");
const { ProductModel } = require("../ProductModel");

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

describe("Product Routes", () => {
    let adminUser, adminToken, regularUser, userToken;

    beforeEach(async () => {
        // Create test users
        ({ user: adminUser, token: adminToken } = await createTestUser(
            "admin"
        ));
        ({ user: regularUser, token: userToken } = await createTestUser(
            "user"
        ));

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

    describe("GET /products", () => {
        it("should return all products", async () => {
            const res = await request(app).get("/products");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.products)).toBe(true);
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
                .post("/products")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(newProduct);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.product.name).toBe("New Vinyl Record");
        });

        it("should return 403 if non-admin user tries to create product", async () => {
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
});
