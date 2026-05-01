const nodemailer = require('nodemailer');
require('dotenv').config();

// ✅ SAFE + RENDER FRIENDLY SMTP CONFIG
let transporter = null;

// Only configure transporter if email credentials exist
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: 587, // ✅ Better than Gmail service shortcut
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },

    // ✅ Prevent hanging on Render
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
}

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

// ✅ SAFE EMAIL FUNCTION (never crashes booking flow)
async function sendEmail(to, subject, htmlContent) {
  // Skip completely if email not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !transporter) {
    console.log(`📧 Email skipped (not configured): ${subject} → ${to}`);
    return {
      success: false,
      skipped: true,
      reason: 'Email not configured'
    };
  }

  try {
    // Optional verify once
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'GoServify'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    });

    console.log(`📧 Email sent successfully to ${to}: ${subject}`);
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (err) {
    // ✅ Never throw → prevents backend hangs
    console.error(`⚠️ Email send failed (${to}):`, err.message);

    return {
      success: false,
      error: err.message
    };
  }
}

// KEEP ALL YOUR EXISTING TEMPLATE FUNCTIONS BELOW EXACTLY SAME:
// bookingConfirmationUser()
// bookingAlertProvider()
// bookingStatusUpdate()

module.exports = {
  sendEmail,
  bookingConfirmationUser,
  bookingAlertProvider,
  bookingStatusUpdate
};