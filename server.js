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

// 6. Define API Routes (GET and POST methods)

// GET: Retrieve all students from the database
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving students', error: error.message });
  }
});

// POST: Create a new student
app.post('/students', async (req, res) => {
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
