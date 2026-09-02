import { describe, it, expect } from 'vitest';
import { generateSecurityKey, generateAppId, generateIpSalt } from '../utils/crypto.mjs';

describe('generateSecurityKey', () => {
	it('returns a base64 string of 44 chars (32 bytes encoded)', () => {
		const key = generateSecurityKey();
		expect(key).toMatch(/^[A-Za-z0-9+/=]{44}$/);
	});

	it('generates unique keys', () => {
		const a = generateSecurityKey();
		const b = generateSecurityKey();
		expect(a).not.toBe(b);
	});
});

describe('generateAppId', () => {
	it('starts with CraftCMS-- prefix', () => {
		expect(generateAppId()).toMatch(/^CraftCMS--/);
	});

	it('contains a valid UUID after prefix', () => {
		const id = generateAppId();
		const uuid = id.replace('CraftCMS--', '');
		expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});
});

describe('generateIpSalt', () => {
	it('returns a 64-char hex string', () => {
		const salt = generateIpSalt();
		expect(salt).toMatch(/^[0-9a-f]{64}$/);
	});
});
