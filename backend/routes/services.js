const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, flexAuth } = require('../middleware/auth');
const { haversineDistance } = require('../utils/geocode');

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Search services with location filtering
router.get('/search', flexAuth, async (req, res) => {
  try {
    const { keyword, category_id, city, lat, lng, radius = 5, sort = 'distance' } = req.query;

    let query = `
      SELECT s.*, 
        p.name as provider_name, p.phone as provider_phone, p.address as provider_address,
        p.city as provider_city, p.lat as provider_lat, p.lng as provider_lng,
        p.avg_rating, p.total_reviews, p.is_verified, p.profile_image as provider_image,
        c.name as category_name, c.icon as category_icon
      FROM services s
      JOIN providers p ON s.provider_id = p.id
      JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = TRUE AND p.is_active = TRUE
    `;
    const params = [];

    if (keyword) {
      query += ' AND (s.title LIKE ? OR s.description LIKE ? OR c.name LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    if (category_id) {
      query += ' AND s.category_id = ?';
      params.push(category_id);
    }

    if (city) {
      query += ' AND LOWER(p.city) = LOWER(?)';
      params.push(city);
    }

    query += ' ORDER BY p.avg_rating DESC';

    const [services] = await db.query(query, params);

    // Apply distance filtering if user coords provided
    let result = services;
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = parseFloat(radius);

      result = services
        .map(s => ({
          ...s,
          distance: s.provider_lat && s.provider_lng
            ? haversineDistance(userLat, userLng, s.provider_lat, s.provider_lng)
            : null
        }))
        .filter(s => s.distance === null || s.distance <= maxRadius);

      if (sort === 'distance') {
        result.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      } else if (sort === 'rating') {
        result.sort((a, b) => b.avg_rating - a.avg_rating);
      } else if (sort === 'price') {
        result.sort((a, b) => a.price - b.price);
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Service search error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

// Get single service detail
router.get('/:id', async (req, res) => {
  try {
    const [services] = await db.query(`
      SELECT s.*, 
        p.name as provider_name, p.phone as provider_phone, p.address as provider_address,
        p.city as provider_city, p.lat as provider_lat, p.lng as provider_lng,
        p.avg_rating, p.total_reviews, p.is_verified, p.bio as provider_bio,
        p.profile_image as provider_image, p.id as provider_id,
        c.name as category_name, c.icon as category_icon
      FROM services s
      JOIN providers p ON s.provider_id = p.id
      JOIN categories c ON s.category_id = c.id
      WHERE s.id = ? AND s.is_active = TRUE
    `, [req.params.id]);

    if (services.length === 0) return res.status(404).json({ message: 'Service not found' });

    // Get reviews
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name, u.profile_image as user_image
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.service_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [req.params.id]);

    res.json({ ...services[0], reviews });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch service' });
  }
});

module.exports = router;
