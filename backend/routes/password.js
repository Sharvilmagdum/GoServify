const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sendEmail } = require('../utils/email');
require('dotenv').config();

// ─────────────────────────────────────────
// POST /api/auth/forgot-password
// Sends reset link to email
// ─────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email, userType = 'user' } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // Check if email exists
    const table = userType === 'provider' ? 'providers' : 'users';
    const [rows] = await db.query(`SELECT id, name, email FROM ${table} WHERE email = ?`, [email]);

    // Always return success (don't reveal if email exists)
    if (rows.length === 0) {
      return res.json({ message: 'If this email exists, a reset link has been sent.' });
    }

    const user = rows[0];

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete old tokens for this email
    await db.query('DELETE FROM password_resets WHERE email = ? AND user_type = ?', [email, userType]);

    // Save new token
    await db.query(
      'INSERT INTO password_resets (email, user_type, token, expires_at) VALUES (?, ?, ?, ?)',
      [email, userType, token, expiresAt]
    );

    // Build reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&type=${userType}`;

    // Send email
    await sendEmail(email, 'Reset Your Servify Password', resetPasswordEmail(user.name, resetUrl));

    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/reset-password
// Resets password using token
// ─────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password)
    return res.status(400).json({ message: 'Token and password required' });

  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    // Find valid token
    const [tokens] = await db.query(
      'SELECT * FROM password_resets WHERE token = ? AND is_used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0)
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });

    const resetRecord = tokens[0];
    const table = resetRecord.user_type === 'provider' ? 'providers' : 'users';

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await db.query(`UPDATE ${table} SET password = ? WHERE email = ?`, [hashedPassword, resetRecord.email]);

    // Mark token as used
    await db.query('UPDATE password_resets SET is_used = TRUE WHERE token = ?', [token]);

    // Send confirmation email
    const [users] = await db.query(`SELECT name, email FROM ${table} WHERE email = ?`, [resetRecord.email]);
    if (users.length > 0) {
      await sendEmail(users[0].email, 'Password Changed Successfully', passwordChangedEmail(users[0].name));
    }

    res.json({ message: 'Password reset successfully! You can now login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// ─────────────────────────────────────────
// GET /api/auth/verify-token/:token
// Checks if reset token is valid
// ─────────────────────────────────────────
router.get('/verify-token/:token', async (req, res) => {
  try {
    const [tokens] = await db.query(
      'SELECT * FROM password_resets WHERE token = ? AND is_used = FALSE AND expires_at > NOW()',
      [req.params.token]
    );
    if (tokens.length === 0)
      return res.status(400).json({ valid: false, message: 'Invalid or expired link' });
    res.json({ valid: true, userType: tokens[0].user_type, email: tokens[0].email });
  } catch (err) {
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// ─── Email Templates ───────────────────────

function resetPasswordEmail(name, resetUrl) {
  return `
  <html><head><style>
    body{font-family:'Segoe UI',sans-serif;background:#f5f5f5;margin:0}
    .wrap{max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
    .head{background:linear-gradient(135deg,#FF6B35,#F7C59F);padding:28px;text-align:center}
    .head h1{color:#fff;margin:0;font-size:24px}
    .body{padding:28px}
    .btn{display:block;background:#FF6B35;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;text-align:center;margin:24px 0}
    .warn{background:#FFF3CD;border:1px solid #FFD700;border-radius:8px;padding:12px 16px;font-size:13px;color:#856404;margin-top:16px}
    .foot{background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#aaa}
    .url{font-size:11px;color:#999;word-break:break-all;margin-top:12px}
  </style></head><body>
  <div class="wrap">
    <div class="head"><h1>🔐 Reset Your Password</h1></div>
    <div class="body">
      <h2>Hi ${name},</h2>
      <p>We received a request to reset your Servify password. Click the button below to create a new password:</p>
      <a href="${resetUrl}" class="btn">Reset My Password</a>
      <div class="warn">
        ⏰ <strong>This link expires in 1 hour.</strong><br/>
        If you didn't request a password reset, you can safely ignore this email.
      </div>
      <p class="url">Or copy this link: ${resetUrl}</p>
    </div>
    <div class="foot">© 2024 Servify — Connecting you with trusted local professionals</div>
  </div></body></html>`;
}

function passwordChangedEmail(name) {
  return `
  <html><head><style>
    body{font-family:'Segoe UI',sans-serif;background:#f5f5f5;margin:0}
    .wrap{max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
    .head{background:linear-gradient(135deg,#10B981,#059669);padding:28px;text-align:center}
    .head h1{color:#fff;margin:0;font-size:24px}
    .body{padding:28px}
    .warn{background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;font-size:13px;color:#DC2626;margin-top:16px}
    .foot{background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#aaa}
  </style></head><body>
  <div class="wrap">
    <div class="head"><h1>✅ Password Changed</h1></div>
    <div class="body">
      <h2>Hi ${name},</h2>
      <p>Your Servify password has been changed successfully.</p>
      <p>You can now login with your new password.</p>
      <div class="warn">
        🚨 <strong>Didn't change your password?</strong><br/>
        If you didn't make this change, please contact us immediately and reset your password again.
      </div>
    </div>
    <div class="foot">© 2024 Servify — Connecting you with trusted local professionals</div>
  </div></body></html>`;
}

module.exports = router;
