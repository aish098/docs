const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidator, loginValidator, handleValidationErrors } = require('../validation/validators');

const router = express.Router();

// --- Local Authentication Routes ---

// @route   POST /auth/register
// @desc    Register a new user locally
// @access  Public
router.post('/register', registerValidator, handleValidationErrors, async (req, res) => {
  const { email, password, displayName } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Create new user for local registration
    user = new User({
      method: 'local',
      email,
      password,
      displayName
    });

    // The pre-save hook in User.js will hash the password
    await user.save();

    // Sign a JWT and send it back
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /auth/login
// @desc    Login a local user
// @access  Public
router.post('/login', loginValidator, handleValidationErrors, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || user.method !== 'local') {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


// --- Google OAuth Routes ---

// @route   GET /auth/google
// @desc    Initiate Google OAuth flow
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /auth/google/callback
// @desc    Callback URL for Google to redirect to
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login-failed', session: true }),
  (req, res) => {
    // Successful authentication, redirect to a profile page or send a success message.
    // The user is now available as req.user
    res.redirect('/auth/profile');
  }
);


// --- Facebook OAuth Routes ---

// @route   GET /auth/facebook
// @desc    Initiate Facebook OAuth flow
// @access  Public
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// @route   GET /auth/facebook/callback
// @desc    Callback URL for Facebook to redirect to
// @access  Public
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login-failed', session: true }),
  (req, res) => {
    // Successful authentication
    res.redirect('/auth/profile');
  }
);


// --- Profile & Status Routes ---

// Simple middleware to check if a user is authenticated via session
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'You are not logged in.' });
}

// @route   GET /auth/profile
// @desc    A protected route for users logged in via OAuth (session-based)
// @access  Private
router.get('/profile', isLoggedIn, (req, res) => {
  res.json({
    message: 'You have successfully logged in with OAuth!',
    user: req.user
  });
});

// A simple route to show login failure
router.get('/login-failed', (req, res) => {
    res.status(401).json({ message: 'Login failed. Please try again.' });
});

module.exports = router;
