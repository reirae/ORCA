/** Length bounds — must match backend/constants/passwordPolicy.js (Argon2id upper cap). */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export const PASSWORD_PLACEHOLDER = `At least ${MIN_PASSWORD_LENGTH} characters`;

export function passwordTooShortError() {
  return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
}

export function passwordTooLongError() {
  return "Password is too long.";
}

/** @returns {string|null} error message, or null if length is acceptable */
export function validatePasswordLength(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return passwordTooShortError();
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return passwordTooLongError();
  }
  return null;
}

export function isPasswordTooLong(password) {
  return typeof password === "string" && password.length > MAX_PASSWORD_LENGTH;
}
