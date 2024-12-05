// middleware for validating auth 
async function validateUserAuth(request, response, next){
    let providedToken = request.headers.jwt;
    console.log(providedToken);

    if (!providedToken){
        return response.status(403).json({
            message: "Sign in to view this content!"
        });
           
    }
    
    let decodedData = decodeJWT(providedToken);
    console.log(decodedData);
    if (decodedData.userId){
        next();
    } else {
        return response.status(403).json({
            message: "Sign in to view this content!"
        });
    }
    
}

module.exports = {
    validateUserAuth
}