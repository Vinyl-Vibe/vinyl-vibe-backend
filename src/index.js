// Purpose: 
// First point of entry 
// Initiate the server 
// Get the port
// Tell the server to listen to web traffic 

require("dotenv").config();
console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);

// Server is configured in this file, not in index.js: 
const {app} = require("./server.js");
const { dbConnect } = require("./utils/database.js");

// Get the PORT value from environment variables
const PORT = process.env.PORT || 8080;

// app.listen(port, callback)
app.listen(PORT, async () => {

    await dbConnect();

	// Server is running if we reach this point in the code!
	console.log("Server is running on port " + PORT);
});