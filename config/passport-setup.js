const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// --- Session Management ---
// Saves the user's ID to the session cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Retrieves the user's data from the database using the ID from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// --- Google OAuth Strategy ---
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 1. Check if user already exists in our DB based on the googleId
    let existingUser = await User.findOne({ googleId: profile.id });

    if (existingUser) {
      // If they exist, we're done.
      return done(null, existingUser);
    }

    // 2. If not, create a new user in our DB
    const newUser = new User({
      method: 'google',
      googleId: profile.id,
      email: profile.emails[0].value,
      displayName: profile.displayName
    });

    await newUser.save();
    done(null, newUser);

  } catch (error) {
    done(error, false);
  }
}));

// --- Facebook OAuth Strategy ---
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: '/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 1. Check if user already exists in our DB based on the facebookId
    let existingUser = await User.findOne({ facebookId: profile.id });

    if (existingUser) {
      return done(null, existingUser);
    }

    // 2. If not, create a new user in our DB
    const newUser = new User({
      method: 'facebook',
      facebookId: profile.id,
      // Facebook may not always provide an email, handle that case
      email: profile.emails && profile.emails[0] ? profile.emails[0].value : `fb_${profile.id}@placeholder.com`,
      displayName: profile.displayName
    });

    await newUser.save();
    done(null, newUser);

  } catch (error) {
    done(error, false);
  }
}));
