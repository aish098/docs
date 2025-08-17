const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

// --- Initial Setup ---
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-super-secret-key-for-jwt-auth'; // In a real app, use a .env file

// --- Middleware ---
app.use(express.json()); // To parse JSON bodies
app.use(cookieParser()); // To parse cookies from the request headers

// --- In-Memory User Store (for demonstration purposes) ---
// In a real application, you would use a database like MongoDB.
const users = [];


// =================================================================
//                      AUTHENTICATION LOGIC
// =================================================================

// @route   POST /register
// @desc    Register a new user
// @access  Public
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    if (users.find(user => user.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store the new user (in-memory)
    const newUser = { id: users.length + 1, username, password: hashedPassword };
    users.push(newUser);

    console.log('Users:', users); // For debugging
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   POST /login
// @desc    Login a user and return a JWT in a cookie
// @access  Public
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // --- Create JWT ---
    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // --- Set JWT in a secure, httpOnly cookie ---
    res.cookie('token', token, {
      httpOnly: true, // The cookie cannot be accessed by client-side scripts
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (requires HTTPS)
      maxAge: 3600000 // 1 hour
    });

    res.json({ message: 'Logged in successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// =================================================================
//                      PROTECTED ROUTE & MIDDLEWARE
// =================================================================

// Middleware to verify the JWT from the cookie
const protectRoute = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user to the request
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};


// @route   GET /api/profile
// @desc    Get user profile data (protected)
// @access  Private
app.get('/api/profile', protectRoute, (req, res) => {
  // The 'protectRoute' middleware has already run and verified the user.
  // The user's data is available in req.user.
  res.json({
    message: 'Welcome to the protected profile route!',
    user: req.user
  });
});


// --- Server Startup ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
