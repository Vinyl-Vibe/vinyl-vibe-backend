// Purpose:
// Configure the server, eg.
// - routes
// - middleware 
// - CORS 
// - debug logger setups
// - connections to databases
// - connections to file storage 

const express = require("express");
const cors = require ("cors");

const app = express();

app.use(express.json());
// allows us to post JSON data to the server

let corsOptions = {
	//                 CRA local                Vite                Deployed React app
	origin: ["http://localhost:8080", "http://localhost:5173", "https://vinylvibe.live"],
	optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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