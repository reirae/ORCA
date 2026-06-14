const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', (req, res) => {
  pool.query(
    'SELECT id, name, email, role, is_verified, is_approved, created_at FROM users',
    (err, results) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    }
  );
});

module.exports = router;