const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Consistent secret used across login and verification
const JWT_SECRET = 'mysecretkey123';

// ----------------- DATABASE CONNECTION -----------------
mongoose
  .connect('mongodb://127.0.0.1:27017/facilityFeedbackDB')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err));

// ----------------- SCHEMAS & MODELS -----------------

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }
});
const User = mongoose.model('User', userSchema);

// Facility Schema
const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true }
});
const Facility = mongoose.model('Facility', facilitySchema);

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  status: { type: String, default: 'Pending' }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

// ----------------- AUTH MIDDLEWARE (FIXED) -----------------
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided in Authorization header' });
  }

  // Safely grab the token whether sent as "Bearer <token>" or raw token
  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Clean away accidental double-quotes, single-quotes, and whitespace
  const cleanToken = token ? token.replace(/["']/g, '').trim() : '';

  jwt.verify(cleanToken, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('JWT Verification Failed:', err.message);
      return res.status(403).json({
        message: 'Invalid or expired token',
        reason: err.message
      });
    }

    req.user = decoded;
    next();
  });
}

// ----------------- AUTH ROUTES -----------------

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    // Embed basic info into the token
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------- FACILITY ROUTES -----------------

// Add new facility
app.post('/api/facilities', async (req, res) => {
  try {
    const { name, category, address, city } = req.body;
    const newFacility = new Facility({ name, category, address, city });
    await newFacility.save();
    res.status(201).json({ message: 'Facility added', facility: newFacility });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all facilities
app.get('/api/facilities', async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a facility
app.delete('/api/facilities/:id', async (req, res) => {
  try {
    await Facility.findByIdAndDelete(req.params.id);
    res.json({ message: 'Facility deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------- FEEDBACK ROUTES -----------------

// Post feedback (Requires token)
app.post('/api/feedback', verifyToken, async (req, res) => {
  try {
    const { facilityId, rating, comment } = req.body;

    const newFeedback = new Feedback({
      facilityId,
      userName: req.user.name,
      rating,
      comment
    });

    await newFeedback.save();
    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: newFeedback
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get feedback for a specific facility
app.get('/api/feedback/:facilityId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ facilityId: req.params.facilityId });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update feedback status (e.g., mark as 'Resolved')
app.put('/api/feedback/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: 'Status updated', feedback: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------- START SERVER -----------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});