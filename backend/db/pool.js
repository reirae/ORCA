const mysql = require('mysql2');
const { system } = require('../utils/winstonLogger');

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
  system.info('Database connection established', { context: 'db', threadId: connection.threadId });
});

pool.on('error', (err) => {
  system.error('Database pool error', { context: 'db', error: err.message });
});

module.exports = pool;