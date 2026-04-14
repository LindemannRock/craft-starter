/**
 * Security key + app ID generation for Craft CMS.
 * Writes values directly to .env — no Craft commands needed.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import crypto from 'crypto';

/**
 * Generate a Craft security key (32 random bytes, base64-encoded).
 *
 */
export function generateSecurityKey() {
	return crypto.randomBytes(32).toString('base64');
}

/**
 * Generate a Craft app ID in the format `CraftCMS--{uuid}`.
 *
 */
export function generateAppId() {
	return `CraftCMS--${crypto.randomUUID()}`;
}

/**
 * Generate a random 64-character hex salt for IP hashing.
 * Used by LR plugins (redirect, shortlink, smartlink, search managers) to
 * hash IP addresses for privacy-preserving analytics.
 *
 */
export function generateIpSalt() {
	return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a random API key with a prefix.
 * Format: {prefix}_{32 random hex chars}
 *
 */
export function generateApiKey(prefix = 'sk') {
	return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}
