const request = require("supertest");
const { app } = require("../../server");
const { createTestUser } = require("../../__tests__/helpers");

describe("Orders API", () => {
    let user, token;

    beforeEach(async () => {
        ({ user, token } = await createTestUser());
    });

    it("should create a new order and return Stripe checkout URL", async () => {
        const res = await request(app)
            .post("/orders")
            .set("Authorization", `Bearer ${token}`)
            .send({
                products: [{ productId: "test_product_id", quantity: 1 }],
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("checkoutUrl");
        expect(res.body.checkoutUrl).toContain("stripe.com");
    });
});
