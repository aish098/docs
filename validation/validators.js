const { check, validationResult } = require('express-validator');

// Middleware to handle the result of the validation checks
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation chain for user registration
const registerValidator = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('displayName', 'Display name is required').not().isEmpty()
];

// Validation chain for user login
const loginValidator = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

module.exports = {
  registerValidator,
  loginValidator,
  handleValidationErrors
};
