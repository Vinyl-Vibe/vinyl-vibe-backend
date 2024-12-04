
let jwtSecretKey = process.env.JWT_SECRET_KEY;


async function generateJWT(userId, username, roles = null){

}

async function decodeJWT(tokenToDecode){

}

// middleware for validating auth 
async function validateUserAuth(request, response, next){

}

module.exports = {
    generateJWT,
    decodeJWT,
    validateUserAuth
}