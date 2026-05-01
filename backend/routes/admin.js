const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { adminAuth } = require('../middleware/auth');

// Dashboard overview stats
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [[bookingStats]] = await db.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'cancelled' OR status = 'rejected' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as total_revenue,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_bookings
      FROM bookings
    `);

    const [[userStats]] = await db.query(`
      SELECT COUNT(*) as total_users, 
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_this_week
      FROM users WHERE role = 'user'
    `);

    const [[providerStats]] = await db.query(`
      SELECT COUNT(*) as total_providers,
        SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN is_verified = FALSE THEN 1 ELSE 0 END) as pending_verification
      FROM providers
    `);

    const [[serviceStats]] = await db.query('SELECT COUNT(*) as total_services FROM services WHERE is_active = TRUE');

    // Monthly revenue chart (last 6 months)
    const [monthlyRevenue] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, 
        COUNT(*) as bookings,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as revenue
      FROM bookings
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);

    // Top categories
    const [topCategories] = await db.query(`
      SELECT c.name, c.icon, COUNT(b.id) as booking_count
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id
      LEFT JOIN bookings b ON b.service_id = s.id
      GROUP BY c.id
      ORDER BY booking_count DESC
      LIMIT 5
    `);

    // Top cities
    const [topCities] = await db.query(`
      SELECT city, COUNT(*) as booking_count
      FROM bookings
      GROUP BY city
      ORDER BY booking_count DESC
      LIMIT 5
    `);

    res.json({
      bookings: bookingStats,
      users: userStats,
      providers: providerStats,
      services: serviceStats,
      charts: { monthly_revenue: monthlyRevenue, top_categories: topCategories, top_cities: topCities }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// List all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, phone, city, is_active, created_at FROM users WHERE role = "user" ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Toggle user active
router.put('/users/:id/toggle', adminAuth, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// List all providers
router.get('/providers', adminAuth, async (req, res) => {
  try {
    const [providers] = await db.query(`
      SELECT p.id, p.name, p.email, p.phone, p.city, p.is_verified, p.is_active, p.avg_rating, p.total_bookings, p.created_at,
        COUNT(s.id) as service_count
      FROM providers p
      LEFT JOIN services s ON s.provider_id = p.id AND s.is_active = TRUE
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(providers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch providers' });
  }
});

// Verify/unverify provider
router.put('/providers/:id/verify', adminAuth, async (req, res) => {
  try {
    await db.query('UPDATE providers SET is_verified = NOT is_verified WHERE id = ?', [req.params.id]);
    res.json({ message: 'Provider verification updated' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// Toggle provider active
router.put('/providers/:id/toggle', adminAuth, async (req, res) => {
  try {
    await db.query('UPDATE providers SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ message: 'Provider status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// All bookings
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { status, city } = req.query;
    let query = `
      SELECT b.*, u.name as user_name, p.name as provider_name, 
        s.title as service_title, c.name as category_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN providers p ON b.provider_id = p.id
      JOIN services s ON b.service_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ' AND b.status = ?'; params.push(status); }
    if (city) { query += ' AND b.city = ?'; params.push(city); }
    query += ' ORDER BY b.created_at DESC LIMIT 200';

    const [bookings] = await db.query(query, params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

module.exports = router;
