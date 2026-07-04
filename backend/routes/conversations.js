const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { ConversationController } = require('../controllers/ConversationController');

const conversations = new ConversationController();

/**
 * Consult conversations. Route wiring only — HTTP handling lives in
 * ConversationController, business rules in ConversationService, and SQL in
 * ConversationRepository / UserRepository.
 *
 *   GET  /api/conversations       inbox for the signed-in worker or expert
 *   POST /api/conversations       worker starts (or re-opens) a consultation
 *   GET  /api/conversations/:id   conversation metadata (participants only)
 */
router.get('/', authMiddleware, requireRole('worker', 'expert'), conversations.list);
router.post('/', authMiddleware, requireRole('worker'), conversations.create);
router.get('/:id', authMiddleware, requireRole('worker', 'expert'), conversations.get);

module.exports = router;
