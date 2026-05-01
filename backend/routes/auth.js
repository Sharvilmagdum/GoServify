const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { geocodeAddress } = require('../utils/geocode');
require('dotenv').config();

/* =========================
   VALIDATION REGEX
========================= */
const nameRegex = /^[A-Za-z\s]+$/;              // Only letters + spaces
const phoneRegex = /^[0-9]{10}$/;              // Exactly 10 digits
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Proper email format

/* =========================
   COMMON VALIDATION FUNCTION
========================= */
const validateRegistration = ({ name, email, password, phone, address, city }) => {
  if (!name || !email || !password || !phone || !address || !city) {
    return 'All fields required';
  }

  if (!nameRegex.test(name)) {
    return 'Name must contain only letters and spaces';
  }

  if (!phoneRegex.test(phone)) {
    return 'Phone number must be exactly 10 digits';
  }

  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
};

/* =========================
   USER REGISTRATION
========================= */
router.post('/register/user', async (req, res) => {
  const { name, email, password, phone, address, city } = req.body;

  // Validation
  const validationError = validateRegistration({
    name,
    email,
    password,
    phone,
    address,
    city
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    // Check existing user
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Geocode
    const coords = await geocodeAddress(address, city);

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users 
      (name, email, password, phone, address, city, lat, lng) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        phone,
        address.trim(),
        city.trim(),
        coords?.lat || null,
        coords?.lng || null
      ]
    );

    // JWT Token
    const token = jwt.sign(
      {
        id: result.insertId,
        email,
        name,
        role: 'user',
        city
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        city,
        role: 'user',
        lat: coords?.lat,
        lng: coords?.lng
      }
    });

  } catch (err) {
    console.error('User registration error:', err);
    res.status(500).json({
      message: 'Registration failed',
      error: err.message
    });
  }
});

/* =========================
   PROVIDER REGISTRATION
========================= */
router.post('/register/provider', async (req, res) => {
  const { name, email, password, phone, address, city, bio } = req.body;

  // Validation
  const validationError = validateRegistration({
    name,
    email,
    password,
    phone,
    address,
    city
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    // Check existing provider
    const [existing] = await db.query(
      'SELECT id FROM providers WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Geocode
    const coords = await geocodeAddress(address, city);

    // Insert provider
    const [result] = await db.query(
      `INSERT INTO providers 
      (name, email, password, phone, address, city, lat, lng, bio) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        phone,
        address.trim(),
        city.trim(),
        coords?.lat || null,
        coords?.lng || null,
        bio ? bio.trim() : null
      ]
    );

    // JWT Token
    const token = jwt.sign(
      {
        id: result.insertId,
        email,
        name,
        role: 'provider',
        city
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Provider registration successful',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        city,
        role: 'provider',
        lat: coords?.lat,
        lng: coords?.lng
      }
    });

  } catch (err) {
    console.error('Provider registration error:', err);
    res.status(500).json({
      message: 'Registration failed',
      error: err.message
    });
  }
});

/* =========================
   USER LOGIN
========================= */
router.post('/login/user', async (req, res) => {
  const { email, password } = req.body;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }

  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        city: user.city,
        lat: user.lat,
        lng: user.lng
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        role: user.role,
        phone: user.phone,
        address: user.address,
        lat: user.lat,
        lng: user.lng,
        profile_image: user.profile_image
      }
    });

  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({
      message: 'Login failed',
      error: err.message
    });
  }
});

/* =========================
   PROVIDER LOGIN
========================= */
router.post('/login/provider', async (req, res) => {
  const { email, password } = req.body;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }

  try {
    const [providers] = await db.query(
      'SELECT * FROM providers WHERE email = ? AND is_active = TRUE',
      [email.trim().toLowerCase()]
    );

    if (providers.length === 0) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const provider = providers[0];

    const match = await bcrypt.compare(password, provider.password);

    if (!match) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: provider.id,
        email: provider.email,
        name: provider.name,
        role: 'provider',
        city: provider.city,
        lat: provider.lat,
        lng: provider.lng
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: provider.id,
        name: provider.name,
        email: provider.email,
        city: provider.city,
        role: 'provider',
        phone: provider.phone,
        address: provider.address,
        lat: provider.lat,
        lng: provider.lng,
        is_verified: provider.is_verified,
        avg_rating: provider.avg_rating,
        profile_image: provider.profile_image
      }
    });

  } catch (err) {
    console.error('Provider login error:', err);
    res.status(500).json({
      message: 'Login failed',
      error: err.message
    });
  }
});

/* =========================
   ADMIN LOGIN
========================= */
router.post('/login/admin', async (req, res) => {
  const { email, password } = req.body;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }

  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND role = "admin"',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin'
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({
      message: 'Login failed'
    });
  }
});

module.exports = router;