const mysql = require('mysql2');
const { log, logError } = require('../utils/winstonLogger');

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
  log(`[DB] ${new Date().toISOString()} - New connection established`, { threadId: connection.threadId });
});

pool.on('error', (err) => {
  logError(`[DB] ${new Date().toISOString()} - Pool error`, { error: err.message });
});

module.exports = pool;