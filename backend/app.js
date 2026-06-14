const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/users', require('./routes/users'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;