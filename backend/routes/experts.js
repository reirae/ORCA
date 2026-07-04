const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { ExpertController } = require('../controllers/ExpertController');

const experts = new ExpertController();

/**
 * GET /api/experts
 * List approved experts for workers to start a consultation. Workers
 * communicate with experts only — not with other workers.
 *
 * Route wiring only: HTTP handling lives in ExpertController, directory rules
 * in ExpertService, and the query in UserRepository.
 */
router.get('/', authMiddleware, requireRole('worker'), experts.list);

module.exports = router;
