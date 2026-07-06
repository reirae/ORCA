// A valid 32-byte (64 hex char) key so encrypt/decrypt work in the test.
process.env.MESSAGE_ENC_KEY = 'a'.repeat(64);

const { encrypt, decrypt, isEncrypted } = require('../utils/messageCipher');

/**
 * SR-06: message content is encrypted at rest with AES-256-GCM. These tests pin
 * the properties that matter: it round-trips, it's non-deterministic, it detects
 * tampering, and it reads legacy plaintext without breaking (rollout safety).
 */
describe('messageCipher', () => {
  test('round-trips plaintext through encrypt -> decrypt', () => {
    const msg = 'Hi Bob, I have a concern about the beam alignment on level 3.';
    const ct = encrypt(msg);
    expect(ct).not.toBe(msg);
    expect(ct.startsWith('v1:')).toBe(true);
    expect(decrypt(ct)).toBe(msg);
  });

  test('ciphertext does not contain the plaintext (safe against a DB dump)', () => {
    const ct = encrypt('secret site photo location');
    expect(ct).not.toContain('secret');
    expect(ct).not.toContain('site');
  });

  test('encryption is non-deterministic (fresh IV per call)', () => {
    expect(encrypt('same message')).not.toBe(encrypt('same message'));
  });

  test('decrypt passes through legacy plaintext unchanged (rollout / seed data)', () => {
    // Rows written before encryption was enabled have no v1: envelope.
    expect(decrypt('Sure, uploading now.')).toBe('Sure, uploading now.');
    // Even a plaintext that happens to start with "v1:" is not misread.
    expect(decrypt('v1: meeting notes')).toBe('v1: meeting notes');
  });

  test('null / undefined pass through both ways', () => {
    expect(encrypt(null)).toBeNull();
    expect(decrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeUndefined();
    expect(decrypt(undefined)).toBeUndefined();
  });

  test('tampered ciphertext fails GCM verification (integrity)', () => {
    const ct = encrypt('do not tamper with me');
    const parts = ct.split(':');
    // Flip the last hex char of the ciphertext segment.
    const last = parts[3];
    parts[3] = last.slice(0, -1) + (last.slice(-1) === 'a' ? 'b' : 'a');
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  test('isEncrypted only recognises the exact v1 envelope', () => {
    expect(isEncrypted(encrypt('x'))).toBe(true);
    expect(isEncrypted('plain text')).toBe(false);
    expect(isEncrypted('v1:not:hex:zzzz')).toBe(false);
    expect(isEncrypted(null)).toBe(false);
  });
});
