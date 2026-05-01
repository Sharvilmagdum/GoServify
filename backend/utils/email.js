const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

// =============================
// BREVO API EMAIL SYSTEM
// SMTP removed because Render timeout issue
// =============================
const transporter = null;

// =============================
// EMAIL STYLES
// =============================
const emailStyles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%); padding: 30px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
  .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0; }
  .body { padding: 30px; }
  .body h2 { color: #1a1a2e; font-size: 20px; margin-top: 0; }
  .body p { color: #555; line-height: 1.6; }
  .card { background: #f9f9f9; border-left: 4px solid #FF6B35; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .card .label { font-size: 12px; color: #999; text-transform: uppercase; }
  .card .value { font-size: 16px; color: #1a1a2e; font-weight: 600; }
  .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .status-pending { background: #FFF3CD; color: #856404; }
  .status-accepted { background: #D1ECF1; color: #0c5460; }
  .status-completed { background: #D4EDDA; color: #155724; }
  .status-rejected { background: #F8D7DA; color: #721c24; }
  .footer { background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; }
  .footer p { color: #aaa; font-size: 12px; margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
`;

// =============================
// SAFE EMAIL FUNCTION (BREVO API)
// =============================
async function sendEmail(to, subject, htmlContent) {
  if (!process.env.BREVO_API_KEY) {
    console.log(`📧 Email skipped (Brevo API not configured): ${subject} → ${to}`);
    return {
      success: false,
      skipped: true,
      reason: 'Brevo API not configured'
    };
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: process.env.APP_NAME || 'GoServify',
          email: process.env.EMAIL_USER
        },

        to: [
          {
            email: to
          }
        ],

        subject: subject,

        htmlContent: htmlContent
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },

        timeout: 15000
      }
    );

    console.log(`📧 Email sent successfully to ${to}: ${subject}`);

    return {
      success: true,
      data: response.data
    };

  } catch (err) {
    console.error(
      `⚠️ Brevo API send failed (${to}):`,
      err.response?.data || err.message
    );

    return {
      success: false,
      error: err.response?.data || err.message
    };
  }
}

// =============================
// BOOKING CONFIRMATION FOR USER
// =============================
function bookingConfirmationUser(user, booking, service, provider) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>🎉 Booking Confirmed</h1>

        <p>Hi ${user?.name || 'User'},</p>

        <p>Your booking for <strong>${service?.title || 'Service'}</strong> has been placed successfully.</p>

        <p><strong>Booking Ref:</strong> #${booking?.booking_ref || 'N/A'}</p>
        <p><strong>Provider:</strong> ${provider?.name || 'Provider'}</p>
        <p><strong>Date:</strong> ${booking?.scheduled_date || 'N/A'}</p>
        <p><strong>Time:</strong> ${booking?.scheduled_time || 'N/A'}</p>
        <p><strong>Address:</strong> ${booking?.address || 'N/A'}</p>

        <p>Thank you for using GoServify.</p>
      </body>
    </html>
  `;
}

// =============================
// NEW BOOKING ALERT FOR PROVIDER
// =============================
function bookingAlertProvider(provider, booking, service, user) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>📋 New Booking Request</h1>

        <p>Hi ${provider?.name || 'Provider'},</p>

        <p>You received a new booking for <strong>${service?.title || 'Service'}</strong>.</p>

        <p><strong>Booking Ref:</strong> #${booking?.booking_ref || 'N/A'}</p>
        <p><strong>Customer:</strong> ${user?.name || 'User'}</p>
        <p><strong>Phone:</strong> ${user?.phone || 'N/A'}</p>
        <p><strong>Date:</strong> ${booking?.scheduled_date || 'N/A'}</p>
        <p><strong>Time:</strong> ${booking?.scheduled_time || 'N/A'}</p>
        <p><strong>Address:</strong> ${booking?.address || 'N/A'}</p>
      </body>
    </html>
  `;
}

// =============================
// STATUS UPDATE EMAIL
// =============================
function bookingStatusUpdate(user, booking, service, status, providerName) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>📌 Booking Status Update</h1>

        <p>Hi ${user?.name || 'User'},</p>

        <p>Your booking for <strong>${service?.title || 'Service'}</strong> is now:</p>

        <h2>${status || 'Updated'}</h2>

        <p><strong>Booking Ref:</strong> #${booking?.booking_ref || 'N/A'}</p>
        <p><strong>Provider:</strong> ${providerName || 'Provider'}</p>

        <p>Thank you for using GoServify.</p>
      </body>
    </html>
  `;
}

module.exports = {
  sendEmail,
  bookingConfirmationUser,
  bookingAlertProvider,
  bookingStatusUpdate
};