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


// =================================================================
//                      AUTHENTICATION (SIMPLE)
// =================================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- User Schema & Model ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// --- Auth Routes (Simple) ---
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    // 2. Hash the password directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create a new user with the hashed password
    const newUser = new User({
      username,
      password: hashedPassword
    });

    // 4. Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      // Use a generic error message for security
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // 2. Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // 3. If credentials are correct, create a JWT
    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    const JWT_SECRET = 'your-super-secret-key-that-is-long-and-random'; // Should be in .env file

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- Auth Middleware (Simple) ---
const authMiddleware = (req, res, next) => {
  // 1. Get the token from the Authorization header
  const authHeader = req.header('Authorization');

  // 2. Check if the header exists and is correctly formatted
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // 3. Extract and verify the token
    const token = authHeader.split(' ')[1]; // Get token from "Bearer <token>"
    const JWT_SECRET = 'your-super-secret-key-that-is-long-and-random'; // Use the same secret
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Attach user info to the request object
    req.user = decoded.user;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// =================================================================

// 6. Define API Routes (GET and POST methods)

// GET: Retrieve all students from the database (PROTECTED)
app.get('/students', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving students', error: error.message });
  }
});

// POST: Create a new student (PROTECTED)
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
