// Purpose:
// Configure the server, eg.
// - routes
// - middleware 
// - CORS 
// - debug logger setups
// - connections to databases
// - connections to file storage 

const express = require("express");
const { User } = require("./models/UserModel");
const { generateJWT } = require("./functions/jwtFunctions");

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

// Auth Routes
app.post("/signup", async (request, response) => {
	// check that a username and password are provided in request.body
	let username = request.body.username;
	let password = request.body.password;

	if (!username || !password) {
		response.status(400).json({
			message:"Incorrect or missing sign-up credentials provided."
		})
	}

	// make a user in the DB using the username an password
	let newUser = await User.create({username: username, password: password});

	// make a JWT based on the username and userID
	let newJwt = generateJWT(newUser.id, newUser.username);

	// return the JWT
	response.json({
		jwt: newJwt,
		user: {
			id: newUser.id,
			username: newUser.username
		}
	});
});

// // Export the app so that other files can control when the server
// // starts and stops 
module.exports = {
	app
};