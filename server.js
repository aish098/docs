const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');

// --- Initial Setup ---

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.error('MongoDB Connection Error:', err));

// --- Middleware ---

// Body parser middleware to handle JSON data
app.use(express.json());

// Express Session Middleware
// This is required for Passport's session-based authentication (used for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Don't create a session until something is stored
  cookie: {
    // secure: true, // Uncomment this in production when using HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Passport Middleware
// This initializes Passport and connects it to our session handling
require('./config/passport-setup'); // This executes the passport configuration file
app.use(passport.initialize());
app.use(passport.session());

// --- Routes ---

// Mount the authentication routes
app.use('/auth', require('./routes/auth'));

// Simple welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the OAuth and Validation API. Use /auth/google or /auth/facebook to start.' });
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
