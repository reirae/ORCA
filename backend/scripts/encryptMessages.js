/**
 * One-off backfill: encrypt any plaintext rows in `messages.content` in place.
 *
 * New messages are encrypted on write (sockets/chat.js), but rows that already
 * existed before encryption was enabled — including the demo seed data — are
 * still plaintext. Run this once after deploying the change (and after seeding)
 * so a database dump reveals nothing:
 *
 *   docker compose -f docker-compose.prod.yml exec -T backend \
 *     node scripts/encryptMessages.js
 *
 * Idempotent and safe to re-run: rows already in the v1 envelope are skipped, so
 * content is never double-encrypted. Requires MESSAGE_ENC_KEY to be set (the
 * same key the app uses).
 */
require('dotenv').config();

const pool = require('../db/pool').promise();
const { encrypt, isEncrypted } = require('../utils/messageCipher');

async function main() {
  const [rows] = await pool.query('SELECT id, content FROM messages');

  let encrypted = 0;
  let skipped = 0;

  for (const row of rows) {
    if (isEncrypted(row.content) || row.content == null) {
      skipped += 1;
      continue;
    }
    await pool.query('UPDATE messages SET content = ? WHERE id = ?', [encrypt(row.content), row.id]);
    encrypted += 1;
  }

  // Values are our own integers, not user input — no CRLF/log-injection risk.
  // eslint-disable-next-line security-node/detect-crlf
  console.log(`messages backfill complete: ${encrypted} encrypted, ${skipped} already-encrypted/empty, ${rows.length} total.`);
  await pool.end();
}

main().catch((err) => {
  console.error('messages backfill failed:', err.message);
  process.exit(1);
});
