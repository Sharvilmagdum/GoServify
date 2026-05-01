const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { providerAuth } = require('../middleware/auth');
const { sendEmail, bookingStatusUpdate } = require('../utils/email');
const { geocodeAddress } = require('../utils/geocode');

// Get provider profile + stats
router.get('/profile', providerAuth, async (req, res) => {
  try {
    const [providers] = await db.query('SELECT * FROM providers WHERE id = ?', [req.user.id]);
    if (providers.length === 0) return res.status(404).json({ message: 'Provider not found' });

    const provider = providers[0];
    delete provider.password;

    // Stats
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status IN ('completed') THEN total_price ELSE 0 END) as earnings
      FROM bookings WHERE provider_id = ?
    `, [req.user.id]);

    res.json({ ...provider, stats: stats[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update provider profile
router.put('/profile', providerAuth, async (req, res) => {
  const { name, phone, address, city, bio } = req.body;
  try {
    let lat = null, lng = null;
    if (address && city) {
      const coords = await geocodeAddress(address, city);
      lat = coords?.lat;
      lng = coords?.lng;
    }

    await db.query(
      'UPDATE providers SET name = ?, phone = ?, address = ?, city = ?, bio = ?, lat = COALESCE(?, lat), lng = COALESCE(?, lng) WHERE id = ?',
      [name, phone, address, city, bio, lat, lng, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// Get provider's services
router.get('/services', providerAuth, async (req, res) => {
  try {
    const [services] = await db.query(`
      SELECT s.*, c.name as category_name, c.icon as category_icon
      FROM services s JOIN categories c ON s.category_id = c.id
      WHERE s.provider_id = ?
      ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

// Add service
router.post('/services', providerAuth, async (req, res) => {
  const { category_id, title, description, price, price_type, duration_mins } = req.body;
  if (!category_id || !title || !price) return res.status(400).json({ message: 'Category, title, and price required' });

  try {
    const [result] = await db.query(
      'INSERT INTO services (provider_id, category_id, title, description, price, price_type, duration_mins) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, category_id, title, description || null, price, price_type || 'fixed', duration_mins || null]
    );
    res.status(201).json({ message: 'Service added', service_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add service' });
  }
});

// Update service
router.put('/services/:id', providerAuth, async (req, res) => {
  const { title, description, price, price_type, duration_mins, is_active } = req.body;
  try {
    await db.query(
      'UPDATE services SET title = ?, description = ?, price = ?, price_type = ?, duration_mins = ?, is_active = ? WHERE id = ? AND provider_id = ?',
      [title, description, price, price_type, duration_mins, is_active, req.params.id, req.user.id]
    );
    res.json({ message: 'Service updated' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// Delete service
router.delete('/services/:id', providerAuth, async (req, res) => {
  try {
    await db.query('UPDATE services SET is_active = FALSE WHERE id = ? AND provider_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Service removed' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

// Get provider's bookings
router.get('/bookings', providerAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, s.title as service_title, u.name as user_name, u.phone as user_phone,
        u.email as user_email, c.name as category_name, c.icon as category_icon
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.user_id = u.id
      JOIN categories c ON s.category_id = c.id
      WHERE b.provider_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    query += ' ORDER BY b.created_at DESC';

    const [bookings] = await db.query(query, params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Update booking status
router.put('/bookings/:id/status', providerAuth, async (req, res) => {
  const { status, cancellation_reason } = req.body;
  const validStatuses = ['accepted', 'rejected', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  try {
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ? AND provider_id = ?', [req.params.id, req.user.id]);
    if (bookings.length === 0) return res.status(404).json({ message: 'Booking not found' });

    const booking = bookings[0];
    await db.query('UPDATE bookings SET status = ?, cancellation_reason = ? WHERE id = ?', [status, cancellation_reason || null, booking.id]);

    // Update provider earnings if completed
    if (status === 'completed') {
      await db.query('UPDATE providers SET total_earnings = total_earnings + ?, total_bookings = total_bookings + 1 WHERE id = ?', [booking.total_price, req.user.id]);
    }

    // Get user and service for email
    const [users] = await db.query('SELECT name, email FROM users WHERE id = ?', [booking.user_id]);
    const [services] = await db.query('SELECT title FROM services WHERE id = ?', [booking.service_id]);
    const [providers] = await db.query('SELECT name FROM providers WHERE id = ?', [req.user.id]);

    if (users.length > 0) {
      await sendEmail(
        users[0].email,
        `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - #${booking.booking_ref}`,
        bookingStatusUpdate(users[0], booking, services[0], status, providers[0].name)
      );
    }

    // Notification
    await db.query(
      'INSERT INTO notifications (recipient_type, recipient_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)',
      ['user', booking.user_id, `booking_${status}`, `Booking ${status}`, `Your booking #${booking.booking_ref} has been ${status}`, JSON.stringify({ booking_id: booking.id })]
    );

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${booking.user_id}`).emit('booking_update', {
        booking_id: booking.id,
        booking_ref: booking.booking_ref,
        status
      });
    }

    res.json({ message: `Booking ${status} successfully` });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Status update failed' });
  }
});

// Get provider reviews
router.get('/reviews', providerAuth, async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name, s.title as service_title
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      WHERE r.provider_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Get notifications
router.get('/notifications', providerAuth, async (req, res) => {
  try {
    const [notifs] = await db.query(
      'SELECT * FROM notifications WHERE recipient_type = "provider" AND recipient_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/read', providerAuth, async (req, res) => {
  await db.query('UPDATE notifications SET is_read = TRUE WHERE recipient_type = "provider" AND recipient_id = ?', [req.user.id]);
  res.json({ message: 'Marked as read' });
});

module.exports = router;
