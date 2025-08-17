// 1. Import necessary modules
const express = require('express');
const mongoose = require('mongoose');

// 2. Initialize Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// 3. Connect to MongoDB
// IMPORTANT: Replace with your own MongoDB connection string
const mongoURI = 'mongodb://localhost:27017/studentsDB'; // Example for a local MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.log('MongoDB connection error:', err));

// 4. Define a Mongoose Schema
// A schema defines the structure of the documents within a collection.
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'], // Data validation: name is required
    trim: true // Trims whitespace from the name
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [6, 'Age must be at least 6'] // Data validation: minimum age
  },
  major: {
    type: String,
    required: [true, 'Major is required'],
    enum: ['Computer Science', 'Engineering', 'Business', 'Arts'] // Data validation: major must be one of these values
  }
});

// 5. Create a Mongoose Model
// A model is a constructor compiled from a Schema definition.
// An instance of a model is a document that can be saved to the database.
const Student = mongoose.model('Student', studentSchema);

// ------------------- AUTHENTICATION CODE START -------------------

// Import additional modules for authentication
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true, // Ensures every username is unique
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  }
});

// Middleware to hash password before saving a new user
// This function runs automatically before a 'save' operation on a User document
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate a "salt" to add to the hash, making it more secure
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// User Model
const User = mongoose.model('User', userSchema);

// ------------------- AUTHENTICATION CODE END -------------------

// 6. Define API Routes

// --- AUTHENTICATION ROUTES ---

// POST: Register a new user
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user (password will be hashed by the pre-save hook)
    user = new User({ username, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// POST: Login a user
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and sign a JSON Web Token (JWT)
    const payload = {
      user: {
        id: user.id
      }
    };

    // IMPORTANT: In a real app, use a long, complex secret and keep it in an environment variable
    const JWT_SECRET = 'your_jwt_secret_key';

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: 3600 }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- MIDDLEWARE ---

// Middleware to verify JWT and protect routes
const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');

  // Check if token exists
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Check if the token is in the correct 'Bearer <token>' format
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7, authHeader.length) : null;
  if (!token) {
    return res.status(401).json({ message: 'Token format is incorrect, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, 'your_jwt_secret_key'); // Use the same secret key

    // Add user from payload to the request object
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};


// --- STUDENT ROUTES (NOW PROTECTED) ---

// GET: Retrieve all students from the database (Protected)
// The `authMiddleware` will run before the route handler
app.get('/students', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving students', error: error.message });
  }
});

// POST: Create a new student (Protected)
// The `authMiddleware` will run before the route handler
app.post('/students', authMiddleware, async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    const savedStudent = await newStudent.save(); // This will trigger Mongoose validation
    res.status(201).json(savedStudent);
  } catch (error) {
    // If validation fails, Mongoose will throw an error
    res.status(400).json({ message: 'Error creating student', error: error.message });
  }
});

// 7. Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
