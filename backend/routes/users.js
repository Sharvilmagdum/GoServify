const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { geocodeAddress } = require('../utils/geocode');

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, phone, address, city, lat, lng, profile_image, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, phone, address, city } = req.body;
  try {
    let lat = null, lng = null;
    if (address && city) {
      const coords = await geocodeAddress(address, city);
      lat = coords?.lat;
      lng = coords?.lng;
    }

    await db.query(
      'UPDATE users SET name = ?, phone = ?, address = ?, city = ?, lat = COALESCE(?, lat), lng = COALESCE(?, lng) WHERE id = ?',
      [name, phone, address, city, lat, lng, req.user.id]
    );

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// Get user notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const [notifs] = await db.query(
      'SELECT * FROM notifications WHERE recipient_type = "user" AND recipient_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/read', authMiddleware, async (req, res) => {
  await db.query('UPDATE notifications SET is_read = TRUE WHERE recipient_type = "user" AND recipient_id = ?', [req.user.id]);
  res.json({ message: 'Marked as read' });
});

module.exports = router;
