const { createProduct } = require("./crud/ProductCrud");
const { dbConnect, dbDisconnect } = require("./database");

async function seed() {
    try {
        const newProduct = await createProduct("Classic Vinyl", 12345); // Pass data
        console.log("New product created:", newProduct);

        console.log("Seeding is done, disconnecting from the database!");
        await dbDisconnect();
    } catch (error) {
        console.error("Error during seeding:", error.message);
    }
}

dbConnect().then(() => {
    console.log("Connected to DB, seeding now!");
    seed();
})
// seed();

// await createPost();