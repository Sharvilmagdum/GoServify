const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sendEmail, bookingConfirmationUser, bookingAlertProvider, bookingStatusUpdate } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

// Generate booking reference
function genRef() {
  return 'SRV' + Date.now().toString(36).toUpperCase().slice(-6);
}

// Create booking (user)
router.post('/', authMiddleware, async (req, res) => {
  const { service_id, scheduled_date, scheduled_time, address, city, lat, lng, notes } = req.body;
  if (!service_id || !scheduled_date || !scheduled_time || !address) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Get service + provider info
    const [services] = await db.query(`
      SELECT s.*, p.id as provider_id, p.name as provider_name, p.email as provider_email,
        p.lat as p_lat, p.lng as p_lng
      FROM services s
      JOIN providers p ON s.provider_id = p.id
      WHERE s.id = ? AND s.is_active = TRUE
    `, [service_id]);

    if (services.length === 0) return res.status(404).json({ message: 'Service not found' });
    const service = services[0];

    const booking_ref = genRef();
    const [result] = await db.query(
      `INSERT INTO bookings (booking_ref, user_id, provider_id, service_id, scheduled_date, scheduled_time, address, city, lat, lng, total_price, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [booking_ref, req.user.id, service.provider_id, service_id, scheduled_date, scheduled_time, address, city || req.user.city, lat || null, lng || null, service.price, notes || null]
    );

    const booking = { id: result.insertId, booking_ref, scheduled_date, scheduled_time, address, total_price: service.price, notes };

    // Fetch user info for email
    const [users] = await db.query('SELECT name, email, phone FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    const provider = { name: service.provider_name, email: service.provider_email };

    // Send emails
    await sendEmail(user.email, `Booking Confirmed - #${booking_ref}`, bookingConfirmationUser(user, booking, service, provider));
    await sendEmail(provider.email, `New Booking Request - #${booking_ref}`, bookingAlertProvider(provider, booking, service, user));

    // Notification
    await db.query(
      'INSERT INTO notifications (recipient_type, recipient_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)',
      ['provider', service.provider_id, 'new_booking', 'New Booking Request', `${user.name} booked ${service.title}`, JSON.stringify({ booking_id: result.insertId, booking_ref })]
    );

    res.status(201).json({ message: 'Booking created successfully', booking_id: result.insertId, booking_ref });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ message: 'Booking failed', error: err.message });
  }
});

// Get user's bookings
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT b.*, s.title as service_title, s.images as service_images,
        p.name as provider_name, p.phone as provider_phone, p.city as provider_city,
        c.name as category_name, c.icon as category_icon,
        r.rating as my_rating, r.review_text as my_review
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN providers p ON b.provider_id = p.id
      JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON r.booking_id = b.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get single booking
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT b.*, s.title as service_title, s.description as service_desc, s.price,
        p.name as provider_name, p.phone as provider_phone, p.address as provider_address, p.city as provider_city,
        u.name as user_name, u.phone as user_phone, u.email as user_email,
        c.name as category_name, c.icon as category_icon
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN providers p ON b.provider_id = p.id
      JOIN users u ON b.user_id = u.id
      JOIN categories c ON s.category_id = c.id
      WHERE b.id = ?
    `, [req.params.id]);

    if (bookings.length === 0) return res.status(404).json({ message: 'Booking not found' });
    const booking = bookings[0];

    // Authorization check
    if (req.user.role === 'user' && booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (req.user.role === 'provider' && booking.provider_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

// Submit review
router.post('/:id/review', authMiddleware, async (req, res) => {
  const { rating, review_text } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5' });

  try {
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = "completed"', [req.params.id, req.user.id]);
    if (bookings.length === 0) return res.status(404).json({ message: 'Booking not found or not completed' });

    const booking = bookings[0];

    await db.query(
      'INSERT INTO reviews (booking_id, user_id, provider_id, service_id, rating, review_text) VALUES (?, ?, ?, ?, ?, ?)',
      [booking.id, req.user.id, booking.provider_id, booking.service_id, rating, review_text || null]
    );

    // Update provider average rating
    const [ratingData] = await db.query('SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews WHERE provider_id = ?', [booking.provider_id]);
    await db.query('UPDATE providers SET avg_rating = ?, total_reviews = ? WHERE id = ?', [ratingData[0].avg, ratingData[0].total, booking.provider_id]);

    res.json({ message: 'Review submitted successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Review already submitted' });
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

module.exports = router;
