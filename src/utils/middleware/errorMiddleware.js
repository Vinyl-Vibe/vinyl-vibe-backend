/**
 * Centralised error handling middleware
 * 
 * Why use error middleware?
 * - Consistent error responses across the API
 * - Separates error handling from business logic
 * - Makes debugging easier with proper error logging
 * - Prevents sensitive error details leaking to client
 */

// Custom error class for known operational errors
class AppError extends Error {
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Main error handling middleware
 * 
 * Why this structure?
 * - Handles different types of errors differently
 * - Provides detailed errors in development
 * - Sanitised errors in production
 * - Maintains error logging for debugging
 */
const errorHandler = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	// Different error responses for development and production
	if (process.env.NODE_ENV === 'development') {
		return sendErrorDev(err, res);
	} else {
		return sendErrorProd(err, res);
	}
};

/**
 * Development error response
 * Includes full error details for debugging
 */
const sendErrorDev = (err, res) => {
	console.error('ERROR 💥', err);
	
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack
	});
};

/**
 * Production error response
 * Sanitised error details for security
 */
const sendErrorProd = (err, res) => {
	// Operational, trusted error: send message to client
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message
		});
	} 
	// Programming or other unknown error: don't leak error details
	else {
		// Log error for debugging
		console.error('ERROR 💥', err);
		
		// Send generic message
		res.status(500).json({
			status: 'error',
			message: 'Something went wrong'
		});
	}
};

/**
 * Error type handlers
 * Why separate handlers?
 * - Different errors need different handling
 * - Makes error messages more user-friendly
 * - Proper status codes for different situations
 */
const handleCastErrorDB = err => {
	const message = `Invalid ${err.path}: ${err.value}`;
	return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
	const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
	const message = `Duplicate field value: ${value}. Please use another value!`;
	return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
	const errors = Object.values(err.errors).map(el => el.message);
	const message = `Invalid input data. ${errors.join('. ')}`;
	return new AppError(message, 400);
};

const handleJWTError = () =>
	new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
	new AppError('Your token has expired! Please log in again.', 401);

module.exports = {
	AppError,
	errorHandler,
	handleCastErrorDB,
	handleDuplicateFieldsDB,
	handleValidationErrorDB,
	handleJWTError,
	handleJWTExpiredError
};
