// ============================================================
// UPDATED server.js — Add these 2 lines to your existing server.js
// Find the "API Routes" section and add:
// ============================================================

// ADD THESE 2 LINES to your existing server.js API Routes section:
app.use('/api/payments', require('./routes/payments'));
app.use('/api/auth', require('./routes/password')); // password routes merge with auth

// ============================================================
// Your existing routes stay the same:
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/services', require('./routes/services'));
// app.use('/api/bookings', require('./routes/bookings'));
// app.use('/api/provider', require('./routes/provider'));
// app.use('/api/admin', require('./routes/admin'));
// app.use('/api/user', require('./routes/users'));
// ============================================================
