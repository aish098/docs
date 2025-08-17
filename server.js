const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// --- Basic Server Setup ---
const app = express();
const PORT = process.env.PORT || 3000;

// =================================================================
//                      SECURITY MIDDLEWARE
// =================================================================

// 1. helmet: Applies a wide range of security-related HTTP headers.
// It helps protect against common vulnerabilities like XSS, clickjacking, etc.
app.use(helmet());

// 2. cors: Handles Cross-Origin Resource Sharing.
// This is crucial for controlling which external domains can make requests to your API.
const corsOptions = {
  // Replace 'http://your-frontend-domain.com' with the actual domain of your front-end app
  origin: ['http://localhost:3000', 'http://your-frontend-domain.com'],
  optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));


// 3. express-rate-limit: Protects against brute-force and DoS attacks.
// This limits the number of requests an IP address can make in a certain timeframe.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
// Apply the rate limiting middleware to all requests
app.use(limiter);


// 4. API Key Authentication: A simple custom middleware for protecting specific routes.
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-KEY');
  const validApiKey = 'your-secret-api-key'; // In a real app, this should be in a .env file

  if (apiKey && apiKey === validApiKey) {
    // If the key is valid, proceed to the next middleware/route handler
    next();
  } else {
    // If the key is missing or invalid, send a 401 Unauthorized response
    res.status(401).json({ error: 'Unauthorized. Please provide a valid API key.' });
  }
};


// =================================================================
//                            API ROUTES
// =================================================================

// --- Public Route ---
// This endpoint is open to everyone. It is still protected by helmet, cors, and rate-limiting.
app.get('/api/public', (req, res) => {
  res.json({
    message: 'This is a public endpoint. Anyone can see this!'
  });
});

// --- Private Route ---
// This endpoint is protected by our custom API key middleware.
app.get('/api/private', apiKeyAuth, (req, res) => {
  res.json({
    message: 'This is a private endpoint. You should only see this if you have a valid API key.',
    secretData: 'Here is some top-secret information.'
  });
});


// =================================================================
//                         SERVER STARTUP
// =================================================================
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
