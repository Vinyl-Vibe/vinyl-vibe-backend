// Mock external services
jest.mock("stripe", () => ({
    Stripe: jest.fn(() => ({
        checkout: {
            sessions: {
                create: jest.fn().mockResolvedValue({
                    id: "test_session_id",
                    url: "https://test.stripe.com/checkout",
                }),
            },
        },
        webhooks: {
            constructEvent: jest.fn().mockReturnValue({
                type: "checkout.session.completed",
                data: { object: { id: "test_session_id" } },
            }),
        },
    })),
}));

jest.mock("resend", () => ({
    Resend: jest.fn(() => ({
        emails: {
            send: jest.fn().mockResolvedValue({
                id: "test_email_id",
                status: "sent",
            }),
        },
    })),
}));

// Mock Google OAuth
jest.mock("passport-google-oauth20", () => ({
    Strategy: jest.fn((config, callback) => {
        callback(null, null, {
            id: "test_google_id",
            emails: [{ value: "test@example.com" }],
            name: { givenName: "Test", familyName: "User" },
        });
        return {};
    }),
}));
