// Purpose:
// Configure the server, eg.
// - routes
// - middleware 
// - CORS 
// - debug logger setups
// - connections to databases
// - connections to file storage 

const express = require("express");
const corsMiddleware = require('./utils/middleware/corsMiddleware')

const app = express();

app.use(express.json());
// allows us to post JSON data to the server
app.use(corsMiddleware)


// Server app configuration goes here
// middleware, routes, etc 

// app.verb(path, callback);
app.get("/", (request, response) => {
	response.json({
		message:"Hello world!"
	});
});

// // Server app configuration is finished by this point 

module.exports = {
	app
};