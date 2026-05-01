require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET (' + process.env.EMAIL_PASSWORD.length + ' chars)' : 'NOT SET');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('\n❌ Connection FAILED:', error.message);
    console.log('\nFix: Make sure EMAIL_PASSWORD is a Gmail App Password');
    console.log('Get one at: https://myaccount.google.com/apppasswords');
  } else {
    console.log('\n✅ Email server connected!');
    console.log('Sending test email...');

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Servify Email Test ✅',
      html: '<h2>Email is working!</h2><p>Your Servify email system is configured correctly.</p>'
    }, (err, info) => {
      if (err) {
        console.log('❌ Send failed:', err.message);
      } else {
        console.log('✅ Email sent successfully! Check your inbox.');
        console.log('Message ID:', info.messageId);
      }
    });
  }
});
