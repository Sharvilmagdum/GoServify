const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const emailStyles = `
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%); padding: 30px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0; }
  .body { padding: 30px; }
  .body h2 { color: #1a1a2e; font-size: 20px; margin-top: 0; }
  .body p { color: #555; line-height: 1.6; }
  .card { background: #f9f9f9; border-left: 4px solid #FF6B35; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .card .label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
  .card .value { font-size: 16px; color: #1a1a2e; font-weight: 600; margin-top: 2px; }
  .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin: 4px 0; }
  .status-pending { background: #FFF3CD; color: #856404; }
  .status-accepted { background: #D1ECF1; color: #0c5460; }
  .status-completed { background: #D4EDDA; color: #155724; }
  .status-rejected { background: #F8D7DA; color: #721c24; }
  .btn { display: inline-block; background: #FF6B35; color: white !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  .footer { background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; }
  .footer p { color: #aaa; font-size: 12px; margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  td:first-child { color: #777; font-size: 14px; }
  td:last-child { color: #1a1a2e; font-weight: 500; text-align: right; }
`;

async function sendEmail(to, subject, htmlContent) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('📧 Email not configured - skipping:', subject, 'to', to);
    return { success: false, reason: 'Email not configured' };
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Goservify'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
}

function bookingConfirmationUser(user, booking, service, provider) {
  return `
  <html><head><style>${emailStyles}</style></head><body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
      <p>Your service request has been received</p>
    </div>
    <div class="body">
      <h2>Hi ${user.name},</h2>
      <p>Your booking for <strong>${service.title}</strong> has been placed successfully! The provider will review and confirm shortly.</p>
      <div class="card">
        <div class="label">Booking Reference</div>
        <div class="value">#${booking.booking_ref}</div>
      </div>
      <table>
        <tr><td>Service</td><td>${service.title}</td></tr>
        <tr><td>Provider</td><td>${provider.name}</td></tr>
        <tr><td>Date</td><td>${new Date(booking.scheduled_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
        <tr><td>Time</td><td>${booking.scheduled_time}</td></tr>
        <tr><td>Address</td><td>${booking.address}</td></tr>
        <tr><td>Amount</td><td>₹${booking.total_price}</td></tr>
        <tr><td>Status</td><td><span class="status-badge status-pending">Pending Confirmation</span></td></tr>
      </table>
      <p>You'll receive another email once the provider accepts your booking.</p>
    </div>
    <div class="footer"><p>© 2024 Servify — Connecting you with trusted local professionals</p></div>
  </div>
  </body></html>`;
}

function bookingAlertProvider(provider, booking, service, user) {
  return `
  <html><head><style>${emailStyles}</style></head><body>
  <div class="container">
    <div class="header">
      <h1>📋 New Booking Request!</h1>
      <p>A customer wants to book your service</p>
    </div>
    <div class="body">
      <h2>Hi ${provider.name},</h2>
      <p>You have a new booking request for <strong>${service.title}</strong>. Please review and respond promptly.</p>
      <div class="card">
        <div class="label">Booking Reference</div>
        <div class="value">#${booking.booking_ref}</div>
      </div>
      <table>
        <tr><td>Customer</td><td>${user.name}</td></tr>
        <tr><td>Phone</td><td>${user.phone || 'Not provided'}</td></tr>
        <tr><td>Date</td><td>${new Date(booking.scheduled_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
        <tr><td>Time</td><td>${booking.scheduled_time}</td></tr>
        <tr><td>Address</td><td>${booking.address}, ${booking.city}</td></tr>
        <tr><td>Amount</td><td>₹${booking.total_price}</td></tr>
        ${booking.notes ? `<tr><td>Notes</td><td>${booking.notes}</td></tr>` : ''}
      </table>
      <p>Log in to your provider dashboard to accept or reject this booking.</p>
    </div>
    <div class="footer"><p>© 2024 Servify — Provider Dashboard</p></div>
  </div>
  </body></html>`;
}

function bookingStatusUpdate(user, booking, service, status, providerName) {
  const statusMessages = {
    accepted: { emoji: '✅', title: 'Booking Accepted!', msg: 'Great news! Your booking has been accepted by the provider. They will arrive at the scheduled time.', badge: 'status-accepted' },
    rejected: { emoji: '❌', title: 'Booking Declined', msg: 'Unfortunately, the provider was unable to accept your booking. Please try booking another provider.', badge: 'status-rejected' },
    completed: { emoji: '🌟', title: 'Service Completed!', msg: 'Your service has been marked as completed. We hope you had a great experience!', badge: 'status-completed' },
    in_progress: { emoji: '🔧', title: 'Service In Progress', msg: 'The provider has started working on your service.', badge: 'status-accepted' }
  };
  const info = statusMessages[status] || statusMessages.accepted;
  
  return `
  <html><head><style>${emailStyles}</style></head><body>
  <div class="container">
    <div class="header">
      <h1>${info.emoji} ${info.title}</h1>
      <p>Booking #${booking.booking_ref}</p>
    </div>
    <div class="body">
      <h2>Hi ${user.name},</h2>
      <p>${info.msg}</p>
      <table>
        <tr><td>Service</td><td>${service.title}</td></tr>
        <tr><td>Provider</td><td>${providerName}</td></tr>
        <tr><td>Date</td><td>${new Date(booking.scheduled_date).toLocaleDateString('en-IN')}</td></tr>
        <tr><td>Status</td><td><span class="status-badge ${info.badge}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td></tr>
      </table>
      ${status === 'completed' ? `<p>Please take a moment to <strong>rate and review</strong> your experience on Servify!</p>` : ''}
    </div>
    <div class="footer"><p>© 2024 Servify — Connecting you with trusted local professionals</p></div>
  </div>
  </body></html>`;
}

module.exports = { sendEmail, bookingConfirmationUser, bookingAlertProvider, bookingStatusUpdate };
