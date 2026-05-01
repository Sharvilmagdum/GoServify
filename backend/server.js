const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
require('./config/db');

const app = express();
const server = http.createServer(app);

// ✅ Allowed origins (Vercel + local)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

// Debug
console.log('🌍 FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('🌍 Allowed Origins:', allowedOrigins);

// ✅ FIXED SOCKET.IO CORS
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Store io in app for use in routes
app.set('io', io);

// ✅ FIXED EXPRESS CORS (NO 500 on blocked origins)
app.use(cors({
  origin: function (origin, callback) {
    // Allow Postman / same-origin / server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('❌ Blocked Origin:', origin);

    // IMPORTANT: Don't throw error → prevents preflight 500
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ MANUAL PRELIGHT FIX (critical for Vercel → Render)
app.options('*', (req, res) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  return res.sendStatus(204);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', require('./routes/users'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    frontend: process.env.FRONTEND_URL
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join', ({ userId, role }) => {
    const room = `${role}_${userId}`;
    socket.join(room);
    console.log(`👤 ${role} ${userId} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ✅ Render host + port binding
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🚀 SERVIFY Backend Running         ║
  ║   Port: ${PORT}                      ║
  ║   Env:  ${process.env.NODE_ENV || 'development'}      ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = { app, io };