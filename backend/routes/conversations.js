const express = require('express');
const router = express.Router();
const pool = require('../db/pool').promise();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { system } = require('../utils/winstonLogger');

const DELETED_EMAIL_SUFFIX = '@orca-deleted';

async function findConversationForUser(conversationId, userId) {
  const [rows] = await pool.query(
    `SELECT c.id, c.worker_id, c.expert_id, c.created_at, c.updated_at,
            w.name AS worker_name, w.email AS worker_email,
            e.name AS expert_name, e.email AS expert_email, e.bio AS expert_bio
       FROM conversations c
       JOIN users w ON w.id = c.worker_id
       JOIN users e ON e.id = c.expert_id
      WHERE c.id = ?
        AND (c.worker_id = ? OR c.expert_id = ?)
        AND w.email NOT LIKE ?
        AND e.email NOT LIKE ?
      LIMIT 1`,
    [conversationId, userId, userId, `%${DELETED_EMAIL_SUFFIX}`, `%${DELETED_EMAIL_SUFFIX}`]
  );
  return rows[0] || null;
}

/**
 * GET /api/conversations
 * Inbox for the signed-in worker or expert.
 */
router.get('/', authMiddleware, requireRole('worker', 'expert'), async (req, res) => {
  try {
    const { id, role } = req.user;
    const isWorker = role === 'worker';

    const [rows] = await pool.query(
      isWorker
        ? `SELECT c.id, c.created_at, c.updated_at,
                  u.id AS counterpart_id, u.name AS counterpart_name,
                  u.bio AS counterpart_bio, 'expert' AS counterpart_role
             FROM conversations c
             JOIN users u ON u.id = c.expert_id
            WHERE c.worker_id = ?
              AND u.email NOT LIKE ?
            ORDER BY c.updated_at DESC`
        : `SELECT c.id, c.created_at, c.updated_at,
                  u.id AS counterpart_id, u.name AS counterpart_name,
                  u.bio AS counterpart_bio, 'worker' AS counterpart_role
             FROM conversations c
             JOIN users u ON u.id = c.worker_id
            WHERE c.expert_id = ?
              AND u.email NOT LIKE ?
            ORDER BY c.updated_at DESC`,
      [id, `%${DELETED_EMAIL_SUFFIX}`]
    );

    res.json({ conversations: rows });
  } catch (err) {
    system.error('Failed to list conversations', { context: 'conversations', error: err.message });
    res.status(500).json({ error: 'Could not load conversations.' });
  }
});

/**
 * POST /api/conversations
 * Worker starts (or re-opens) a consultation with an approved expert.
 * Body: { expertId }
 */
router.post('/', authMiddleware, requireRole('worker'), async (req, res) => {
  const expertId = parseInt(req.body.expertId, 10);
  if (!Number.isInteger(expertId) || expertId < 1) {
    return res.status(400).json({ error: 'A valid expert ID is required.' });
  }
  if (expertId === req.user.id) {
    return res.status(400).json({ error: 'Cannot start a consultation with yourself.' });
  }

  try {
    const [experts] = await pool.query(
      `SELECT id, name, bio FROM users
        WHERE id = ? AND role = 'expert' AND is_approved = TRUE
          AND is_hard_locked = FALSE AND email NOT LIKE ?
        LIMIT 1`,
      [expertId, `%${DELETED_EMAIL_SUFFIX}`]
    );
    if (!experts.length) {
      return res.status(404).json({ error: 'Expert not found or not available.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM conversations WHERE worker_id = ? AND expert_id = ? LIMIT 1',
      [req.user.id, expertId]
    );
    if (existing.length) {
      const conversation = await findConversationForUser(existing[0].id, req.user.id);
      return res.json({ conversation, created: false });
    }

    const [result] = await pool.query(
      'INSERT INTO conversations (worker_id, expert_id) VALUES (?, ?)',
      [req.user.id, expertId]
    );

    const conversation = await findConversationForUser(result.insertId, req.user.id);

    // Real-time: tell both participants' personal rooms so an open consult list
    // (e.g. the expert's) shows the new conversation without a manual refresh.
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${expertId}`).emit('conversation:new', { conversationId: result.insertId });
      io.to(`user:${req.user.id}`).emit('conversation:new', { conversationId: result.insertId });
    }

    res.status(201).json({ conversation, created: true });
  } catch (err) {
    system.error('Failed to create conversation', { context: 'conversations', error: err.message });
    res.status(500).json({ error: 'Could not start consultation.' });
  }
});

/**
 * GET /api/conversations/:id
 * Conversation metadata — only for participants.
 */
router.get('/:id', authMiddleware, requireRole('worker', 'expert'), async (req, res) => {
  const conversationId = parseInt(req.params.id, 10);
  if (!Number.isInteger(conversationId) || conversationId < 1) {
    return res.status(400).json({ error: 'Invalid conversation ID.' });
  }

  try {
    const row = await findConversationForUser(conversationId, req.user.id);
    if (!row) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const isWorker = req.user.role === 'worker';
    res.json({
      conversation: {
        id: row.id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        counterpart: isWorker
          ? { id: row.expert_id, name: row.expert_name, role: 'expert', bio: row.expert_bio }
          : { id: row.worker_id, name: row.worker_name, role: 'worker' },
      },
    });
  } catch (err) {
    system.error('Failed to read conversation', { context: 'conversations', error: err.message });
    res.status(500).json({ error: 'Could not load conversation.' });
  }
});

module.exports = router;
