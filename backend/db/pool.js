const mysql = require('mysql2');
const { sanitizeLog } = require('../utils/sanitize');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

pool.on('connection', (connection) => {
  console.log(`[DB] ${new Date().toISOString()} - New connection established (id: ${sanitizeLog(connection.threadId)})`);
});

pool.on('error', (err) => {
  console.error(`[DB] ${new Date().toISOString()} - Pool error: ${sanitizeLog(err.message)}`);
});

module.exports = pool;