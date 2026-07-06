/**
 * Shared password length bounds. Upper limit protects Argon2id hashing from
 * abuse via extremely long inputs (CPU/memory DoS) while staying well above
 * any reasonable memorized secret length.
 */
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

module.exports = { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH };
