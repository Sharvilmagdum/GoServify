const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sendEmail, bookingConfirmationUser, bookingAlertProvider } = require('../utils/email');

// Generate booking reference
function genRef() {
  return 'SRV' + Date.now().toString(36).toUpperCase().slice(-6);
}

// Create booking (user)
router.post('/', authMiddleware, async (req, res) => {
  const { service_id, scheduled_date, scheduled_time, address, city, lat, lng, notes } = req.body;

  console.log("📌 BOOKING REQUEST:", req.body);

  if (!service_id || !scheduled_date || !scheduled_time || !address) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // STEP 1: Get service + provider info
    const [services] = await db.query(`
      SELECT s.*, p.id as provider_id, p.name as provider_name, p.email as provider_email
      FROM services s
      JOIN providers p ON s.provider_id = p.id
      WHERE s.id = ? AND s.is_active = TRUE
    `, [service_id]);

    if (services.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const service = services[0];

    // STEP 2: Insert booking immediately
    const booking_ref = genRef();

    const [result] = await db.query(
      `INSERT INTO bookings 
      (booking_ref, user_id, provider_id, service_id, scheduled_date, scheduled_time, address, city, lat, lng, total_price, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking_ref,
        req.user.id,
        service.provider_id,
        service_id,
        scheduled_date,
        scheduled_time,
        address,
        city || req.user.city || null,
        lat || null,
        lng || null,
        service.price,
        notes || null
      ]
    );

    console.log("✅ Booking inserted:", result.insertId);

    // STEP 3: Respond FIRST (prevents hanging)
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking_id: result.insertId,
      booking_ref
    });

    // STEP 4: Background tasks (non-blocking)
    try {
      // Fetch user info
      const [users] = await db.query(
        'SELECT name, email, phone FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length > 0) {
        const user = users[0];
        const provider = {
          name: service.provider_name,
          email: service.provider_email
        };

        const booking = {
          id: result.insertId,
          booking_ref,
          scheduled_date,
          scheduled_time,
          address,
          total_price: service.price,
          notes
        };

        // Send emails safely
        if (user.email) {
          await sendEmail(
            user.email,
            `Booking Confirmed - #${booking_ref}`,
            bookingConfirmationUser(user, booking, service, provider)
          );
        }

        if (provider.email) {
          await sendEmail(
            provider.email,
            `New Booking Request - #${booking_ref}`,
            bookingAlertProvider(provider, booking, service, user)
          );
        }

        // Notification safely
        await db.query(
          `INSERT INTO notifications 
          (recipient_type, recipient_id, type, title, message, data) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            'provider',
            service.provider_id,
            'new_booking',
            'New Booking Request',
            `${user.name} booked ${service.title}`,
            JSON.stringify({
              booking_id: result.insertId,
              booking_ref
            })
          ]
        );

        console.log("📩 Notifications + emails completed");
      }
    } catch (backgroundErr) {
      console.error("⚠️ Background booking tasks failed:", backgroundErr.message);
    }

  } catch (err) {
    console.error('❌ Booking error:', err);
    return res.status(500).json({
      success: false,
      message: 'Booking failed',
      error: err.message
    });
  }
});

module.exports = router;