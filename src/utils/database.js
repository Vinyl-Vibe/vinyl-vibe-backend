const mongoose = require("mongoose");
const { ProductModel } = require("../models/ProductModel");


// Function to connect to whatever DB our environment variable says to connect to
async function dbConnect(){
    console.log("Attempting to connect to:", process.env.DATABASE_URL);
    let databaseUrl = process.env.DATABASE_URL || `mongodb://127.0.0.1:27017/${process.env.npm_package_name}`;
    
    try {
        await mongoose.connect(databaseUrl);
        console.log("Successfully connected to MongoDB!");
    } catch (error) {
        console.error("Database connection error:", error);
        throw error;
    }
}

async function dbDisconnect(){
    // await mongoose.disconnect()
    // Graceful disconnect from MongoDB
    await mongoose.connection.close();
}

async function dbDrop(){
    await mongoose.connection.db.dropDatabase();
}

module.exports = {
    dbConnect, dbDisconnect, dbDrop
}