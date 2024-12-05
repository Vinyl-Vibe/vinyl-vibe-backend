const cors = require('cors')

// CORS configuration to control which domains can access our API
const corsOptions = {
  // Allow requests from our front-end applications
  origin: [
    'http://localhost:8080',    // CRA local development
    'http://localhost:5173',    // Vite local development
    'https://vinylvibe.live'    // Production front-end
  ],
  // Some legacy browsers (IE11, various SmartTVs) choke on 204
  optionsSuccessStatus: 200
}

// Export the configured cors middleware
const corsMiddleware = cors(corsOptions)

module.exports = corsMiddleware