// Purpose:
// Configure the server, eg.
// - routes
// - middleware 
// - CORS 
// - debug logger setups
// - connections to databases
// - connections to file storage 

const express = require("express");
const app = express();

app.use(express.json());
// allows us to post JSON data to the server

// Server app configuration goes here
// middleware, routes, etc 

// app.verb(path, callback);
app.get("/", (request, response) => {
	response.json({
		message:"Hello world!"
	});
});


// // Server app configuration is finished by this point 

// // Export the app so that other files can control when the server
// // starts and stops 
module.exports = {
	app
};