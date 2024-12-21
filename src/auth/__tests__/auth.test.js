const request = require("supertest");
const { app } = require("../../server");
const { createTestUser } = require("../helpers");

describe("Auth Routes", () => {
    let adminUser, adminToken, regularUser, userToken;

    beforeEach(async () => {
        ({ user: adminUser, token: adminToken } = await createTestUser(
            "admin"
        ));
        ({ user: regularUser, token: userToken } = await createTestUser(
            "user"
        ));
    });

    describe("POST /auth/login", () => {
        it("should login with valid credentials", async () => {
            const res = await request(app).post("/auth/login").send({
                email: regularUser.email,
                password: "password123",
            });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("token");
        });
    });
});
