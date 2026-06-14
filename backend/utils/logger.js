const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const pool = require('../db/pool');
const { sanitizeLog } = require('./sanitize');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Morgan write stream
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Morgan middleware - writes to file
const httpLogger = morgan('combined', { stream: accessLogStream });

// Audit logger - writes security events to MySQL
const auditLog = ({ userId = null, actionType, resourceType = null, resourceId = null, ip = null }) => {
  pool.query(
    'INSERT INTO audit_logs (user_id, action_type, resource_type, resource_id, source_ip) VALUES (?, ?, ?, ?, ?)',
    [userId, sanitizeLog(actionType), resourceType ? sanitizeLog(resourceType) : null, resourceId, ip ? sanitizeLog(ip) : null],
    (err) => {
      if (err) console.error(`[AUDIT] Failed to write audit log: ${sanitizeLog(err.message)}`);
    }
  );
};

module.exports = { httpLogger, auditLog };