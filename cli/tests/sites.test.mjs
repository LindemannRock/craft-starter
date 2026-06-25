import { describe, it, expect } from 'vitest';
import { defaultLabel } from '../prompts/sites.mjs';

describe('defaultLabel', () => {
	it('uses native language names for plain language codes', () => {
		expect(defaultLabel('ar')).toBe('العربية');
		expect(defaultLabel('de')).toBe('Deutsch');
	});

	it('preserves region codes for locale-specific sites', () => {
		expect(defaultLabel('en-US')).toBe('English (US)');
		expect(defaultLabel('en-GB')).toBe('English (GB)');
		expect(defaultLabel('ar-AE')).toBe('العربية (AE)');
	});
});
