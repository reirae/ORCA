const sanitizeLog = (value) => String(value).replace(/[\r\n]/g, ' ');

module.exports = { sanitizeLog };