/**
 * Shared input validators and sanitizers used across prompt and action modules.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

// Matches the standard Craft/RFC-ish email pattern: local@domain.tld with
// optional sub-labels. Rejects things like `hello@foo` (no TLD).
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(value) {
	return EMAIL_REGEX.test(String(value || '').trim());
}

/**
 * Wraps a value in single quotes with internal single-quote escaping,
 * making it safe to interpolate into a shell command string.
 *
 */
export function shellEscape(value) {
	return "'" + String(value).replace(/'/g, "'\\''") + "'";
}
