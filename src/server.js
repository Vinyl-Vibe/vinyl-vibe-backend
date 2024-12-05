// Purpose:
// Configure the server, eg.
// - routes
// - middleware 
// - CORS 
// - debug logger setups
// - connections to databases
// - connections to file storage 

const express = require("express");
const { User } = require("./users/UserModel");
const { generateJWT } = require("./utils/middleware/jwtMiddleware");
const { validateUserAuth } = require("./utils/middleware/authMiddleware");
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
app.get("/protectedRoute", validateUserAuth, (request, response) => {
	response.json({
		message:"You can see protected content because you're signed in!"
	})
})

module.exports = {
	app
};