const mysql = require('mysql2/promise');
require('dotenv').config();

// Connection pool - reused across all queries instead of opening
// a new connection per request.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'patient_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // return DATE columns as 'YYYY-MM-DD' strings, not JS Date objects
});

module.exports = pool;
