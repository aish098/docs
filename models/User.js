const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    // Password is not required for OAuth users
  },
  googleId: {
    type: String,
  },
  facebookId: {
    type: String,
  },
  displayName: {
    type: String,
  }
}, { timestamps: true });

// Hash password before saving for local users
userSchema.pre('save', async function(next) {
  try {
    // Only hash the password if the user is local and the password has been modified
    if (this.method !== 'local' || !this.isModified('password')) {
      return next();
    }

    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords for local users
userSchema.methods.isValidPassword = async function(newPassword) {
  try {
    return await bcrypt.compare(newPassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
