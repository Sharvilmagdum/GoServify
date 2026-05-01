const mysql = require('mysql2/promise');
require('dotenv').config();

// ✅ CLEAN FIXED CONFIG for Render + Railway
const pool = mysql.createPool({
  host: process.env.DB_HOST ? process.env.DB_HOST.trim() : 'localhost',
  user: process.env.DB_USER ? process.env.DB_USER.trim() : 'root',
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : '',
  database: process.env.DB_NAME ? process.env.DB_NAME.trim() : 'servify_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+05:30'
});

// ✅ Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();

    console.log('✅ MySQL connected successfully');
    console.log('📌 DB Host:', process.env.DB_HOST);
    console.log('📌 DB User:', process.env.DB_USER);
    console.log('📌 DB Name:', process.env.DB_NAME);
    console.log('📌 DB Port:', process.env.DB_PORT);

    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
  }
})();

module.exports = pool;