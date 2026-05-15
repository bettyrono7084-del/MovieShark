const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getAsync, runAsync, allAsync } = require('../db/init');
const { generateToken } = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existingUser = await getAsync('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const result = await runAsync(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // Generate token
    const token = generateToken(username);

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      userId: result.lastID,
      username
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Find user by username
    const user = await getAsync('SELECT id, username, email, password FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Generate token
    const token = generateToken(user.username);

    res.json({
      message: 'Login successful.',
      token,
      userId: user.id,
      username: user.username,
      email: user.email
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// Get user profile (requires authentication)
router.get('/profile', async (req, res) => {
  try {
    const user = await getAsync('SELECT id, username, email, created_at FROM users WHERE username = ?', [req.user.username]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

module.exports = router;
