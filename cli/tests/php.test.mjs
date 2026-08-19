import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PHP_VERSION,
	PHP_VERSION_OPTIONS,
	SUPPORTED_PHP_VERSIONS,
} from '../config/php.mjs';

describe('PHP version configuration', () => {
	it('supports every maintained Craft 5 PHP version', () => {
		expect(SUPPORTED_PHP_VERSIONS).toEqual(['8.5', '8.4', '8.3', '8.2']);
	});

	it('keeps the default available in the shared prompt options', () => {
		expect(DEFAULT_PHP_VERSION).toBe('8.3');
		expect(PHP_VERSION_OPTIONS.some(({ value }) => value === DEFAULT_PHP_VERSION)).toBe(true);
	});
});
