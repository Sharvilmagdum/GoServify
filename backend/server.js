const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
require('./config/db');

const app = express();
const server = http.createServer(app);

// ✅ Allowed origins (Production + Preview + Local)
const allowedOrigins = [
  process.env.FRONTEND_URL,

  // ✅ Production Vercel
  'https://go-servify.vercel.app',

  // ✅ Current Preview
  'https://go-servify-99je9pzgo-sharvilmagdums-projects.vercel.app',

  // ✅ Localhost
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

// Debug
console.log('🌍 FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('🌍 Allowed Origins:', allowedOrigins);

// =============================
// SOCKET.IO CORS
// =============================
const io = socketIO(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      console.log('❌ Blocked Socket Origin:', origin);
      return callback(null, false);
    },

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Store io in app for routes
app.set('io', io);

// =============================
// EXPRESS CORS
// =============================
app.use(cors({
  origin: function (origin, callback) {
    // Allow Postman / server-to-server / same-origin
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    console.log('❌ Blocked Origin:', origin);

    // Prevent 500
    return callback(null, false);
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// =============================
// MANUAL PREFLIGHT FIX
// =============================
app.options('*', (req, res) => {
  const origin = req.headers.origin;

  if (
    origin &&
    (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    )
  ) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  return res.sendStatus(204);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================
// STATIC FILES
// =============================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================
// API ROUTES
// =============================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', require('./routes/users'));

// =============================
// HEALTH CHECK
// =============================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    frontend: process.env.FRONTEND_URL
  });
});

// =============================
// 404 HANDLER
// =============================
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// =============================
// SOCKET CONNECTION
// =============================
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

// =============================
// SERVER START
// =============================
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