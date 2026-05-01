const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
require('dotenv').config();

// Initialize Razorpay
let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (e) {
  console.log('⚠️  Razorpay not installed. Run: npm install razorpay');
}

const getRazorpay = () => {
  if (!Razorpay) throw new Error('Razorpay not installed. Run: npm install razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ─────────────────────────────────────────
// POST /api/payments/create-order
// Creates a Razorpay order for a booking
// ─────────────────────────────────────────
router.post('/create-order', authMiddleware, async (req, res) => {
  const { booking_id } = req.body;
  if (!booking_id) return res.status(400).json({ message: 'booking_id required' });

  try {
    // Get booking
    const [bookings] = await db.query(
      'SELECT b.*, s.title as service_title, u.name as user_name, u.email as user_email FROM bookings b JOIN services s ON b.service_id = s.id JOIN users u ON b.user_id = u.id WHERE b.id = ? AND b.user_id = ?',
      [booking_id, req.user.id]
    );

    if (bookings.length === 0)
      return res.status(404).json({ message: 'Booking not found' });

    const booking = bookings[0];

    if (booking.payment_status === 'paid')
      return res.status(400).json({ message: 'Booking already paid' });

    if (booking.status === 'rejected' || booking.status === 'cancelled')
      return res.status(400).json({ message: 'Cannot pay for rejected/cancelled booking' });

    const razorpay = getRazorpay();
    const amountInPaise = Math.round(booking.total_price * 100); // Convert to paise

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `booking_${booking_id}`,
      notes: {
        booking_id: booking_id.toString(),
        user_id: req.user.id.toString(),
        service: booking.service_title,
      },
    });

    // Save order in DB
    await db.query(
      'INSERT INTO payments (booking_id, user_id, razorpay_order_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?)',
      [booking_id, req.user.id, order.id, booking.total_price, 'INR', 'created']
    );

    // Update booking with order_id
    await db.query('UPDATE bookings SET order_id = ? WHERE id = ?', [order.id, booking_id]);

    res.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingRef: booking.booking_ref,
      serviceName: booking.service_title,
      userName: booking.user_name,
      userEmail: booking.user_email,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/payments/verify
// Verifies Razorpay payment signature
// ─────────────────────────────────────────
router.post('/verify', authMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return res.status(400).json({ message: 'Missing payment details' });

  try {
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark payment failed
      await db.query(
        'UPDATE payments SET status = "failed" WHERE razorpay_order_id = ?',
        [razorpay_order_id]
      );
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Get payment details from Razorpay
    const razorpay = getRazorpay();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Update payment record
    await db.query(
      `UPDATE payments SET 
        razorpay_payment_id = ?, razorpay_signature = ?, 
        status = 'paid', payment_method = ?
       WHERE razorpay_order_id = ?`,
      [razorpay_payment_id, razorpay_signature, payment.method, razorpay_order_id]
    );

    // Update booking payment status
    await db.query(
      `UPDATE bookings SET 
        payment_status = 'paid', payment_id = ?, payment_method = ?
       WHERE id = ?`,
      [razorpay_payment_id, payment.method, booking_id]
    );

    // Send payment confirmation email
    const { sendEmail } = require('../utils/email');
    const [bookings] = await db.query(
      'SELECT b.*, u.name, u.email, s.title FROM bookings b JOIN users u ON b.user_id = u.id JOIN services s ON b.service_id = s.id WHERE b.id = ?',
      [booking_id]
    );

    if (bookings.length > 0) {
      const b = bookings[0];
      await sendEmail(
        b.email,
        `Payment Confirmed - #${b.booking_ref}`,
        paymentConfirmationEmail(b.name, b.booking_ref, b.title, b.total_price, razorpay_payment_id)
      );
    }

    res.json({ message: 'Payment verified successfully', paymentId: razorpay_payment_id });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/payments/history
// Get user's payment history
// ─────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, b.booking_ref, s.title as service_title, pr.name as provider_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN services s ON b.service_id = s.id
       JOIN providers pr ON b.provider_id = pr.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/payments/key
// Get Razorpay public key for frontend
// ─────────────────────────────────────────
router.get('/key', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

// Payment confirmation email template
function paymentConfirmationEmail(name, bookingRef, serviceName, amount, paymentId) {
  return `
  <html><head><style>
    body{font-family:'Segoe UI',sans-serif;background:#f5f5f5;margin:0}
    .wrap{max-width:580px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
    .head{background:linear-gradient(135deg,#10B981,#059669);padding:28px;text-align:center}
    .head h1{color:#fff;margin:0;font-size:26px}
    .body{padding:28px}
    .card{background:#f0fdf4;border-left:4px solid #10B981;border-radius:8px;padding:14px 18px;margin:16px 0}
    .amount{font-size:36px;font-weight:800;color:#10B981;text-align:center;padding:16px}
    table{width:100%;border-collapse:collapse}td{padding:8px 0;border-bottom:1px solid #f0f0f0}
    td:first-child{color:#777;font-size:13px}td:last-child{text-align:right;font-weight:500}
    .foot{background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#aaa}
  </style></head><body>
  <div class="wrap">
    <div class="head"><h1>💳 Payment Confirmed!</h1><p style="color:rgba(255,255,255,.9);margin:4px 0">Your payment was successful</p></div>
    <div class="body">
      <h2>Hi ${name},</h2>
      <p>Your payment has been received successfully!</p>
      <div class="amount">₹${Number(amount).toLocaleString()}</div>
      <div class="card">
        <div style="font-size:11px;color:#999;text-transform:uppercase">Booking Reference</div>
        <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-top:2px">#${bookingRef}</div>
      </div>
      <table>
        <tr><td>Service</td><td>${serviceName}</td></tr>
        <tr><td>Amount Paid</td><td>₹${Number(amount).toLocaleString()}</td></tr>
        <tr><td>Payment ID</td><td style="font-size:11px;font-family:monospace">${paymentId}</td></tr>
        <tr><td>Status</td><td><span style="background:#D4EDDA;color:#155724;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">PAID ✓</span></td></tr>
      </table>
      <p style="margin-top:16px;color:#555;">Thank you for using Servify! Your provider will be in touch shortly.</p>
    </div>
    <div class="foot">© 2024 Servify — Connecting you with trusted local professionals</div>
  </div></body></html>`;
}

module.exports = router;
