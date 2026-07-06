const { Argon2PasswordHasher, DEFAULT_HASH_OPTIONS } = require('../adapters/PasswordHasher');

/**
 * Password utilities. Hashing is delegated to the Argon2PasswordHasher adapter
 * (see adapters/PasswordHasher.js); this module keeps the stable function API
 * the rest of the app already imports, plus the server-side password policy.
 *
 * HASH_OPTIONS is re-exported unchanged so it still matches the seed file's
 * hash format ($argon2id$v=19$m=65536,t=3,p=4$...).
 */
const HASH_OPTIONS = DEFAULT_HASH_OPTIONS;
const hasher = new Argon2PasswordHasher(HASH_OPTIONS);

async function hashPassword(plain) {
  return hasher.hash(plain);
}

async function verifyPassword(hash, plain) {
  return hasher.verify(hash, plain);
}

const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../constants/passwordPolicy');

/**
 * Basic password policy. Kept deliberately simple and length-forward (length
 * matters far more than character-class rules). Tune to match the team's
 * agreed policy; the important part is that it's enforced server-side, never
 * trusting the client.
 */
function passwordPolicyError(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return 'Password is too long.';
  }
  return null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  passwordPolicyError,
  HASH_OPTIONS,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
};
