import { describe, it, expect } from 'vitest';
import { defaultLabel, isValidSiteHandle, urlPrefixFromHandle } from '../prompts/sites.mjs';

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

describe('isValidSiteHandle', () => {
	it('accepts code-safe Craft/env handles', () => {
		expect(isValidSiteHandle('en')).toBe(true);
		expect(isValidSiteHandle('en_us')).toBe(true);
		expect(isValidSiteHandle('site2')).toBe(true);
	});

	it('rejects handles that would produce invalid env var names', () => {
		expect(isValidSiteHandle('en-us')).toBe(false);
		expect(isValidSiteHandle('2site')).toBe(false);
		expect(isValidSiteHandle('En')).toBe(false);
	});
});

describe('urlPrefixFromHandle', () => {
	it('keeps generated prefixes URL-safe when handles use underscores', () => {
		expect(urlPrefixFromHandle('en_us')).toBe('en-us');
		expect(urlPrefixFromHandle('arabic')).toBe('arabic');
	});
});
