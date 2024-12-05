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
