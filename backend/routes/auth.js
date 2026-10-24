const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register — students only, admin is seeded at startup
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, studentId, role } = req.body;

    if (!email.endsWith('@g.bracu.ac.bd')) {
      return res.status(400).json({ message: 'Only @g.bracu.ac.bd email addresses are allowed' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name, email, phone,
      password: hashed,
      userType: 'student',
      studentId,
      role,
      status: 'Pending',
    });

    res.status(201).json({ message: 'Registration submitted! Waiting for admin approval.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (userType === 'student' && !email.endsWith('@g.bracu.ac.bd')) {
      return res.status(400).json({ message: 'Students must use their @g.bracu.ac.bd email' });
    }

    const user = await User.findOne({ email, userType });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.userType === 'student' && user.status !== 'Approved') {
      return res.status(403).json({ message: 'Your account is pending admin approval' });
    }

    const token = jwt.sign(
      { id: user._id, userType: user.userType, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
