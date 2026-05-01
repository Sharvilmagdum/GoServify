const mysql = require('mysql2/promise');
require('dotenv').config();

// ✅ FIXED for Render + Railway
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

// ✅ Better connection test
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
  }
})();

module.exports = pool;