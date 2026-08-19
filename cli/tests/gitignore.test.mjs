import { describe, it, expect } from 'vitest';
import { setBuildFilesIgnored, setPlatformPaths, stripStarterOnlyIgnores } from '../actions/gitignore.mjs';

describe('stripStarterOnlyIgnores', () => {
	const content = [
		'# Craft CMS',
		'/config/license.key',
		'',
		'# Project config — TEMPORARY during active starter + plugin development.',
		'# The starter has no fixed project configuration yet.',
		'# make create removes this section for downstream projects.',
		'/config/project/',
		'',
		'# Lock files — TEMPORARY for starter development.',
		'/composer.lock',
		'/package-lock.json',
		'',
		'# Dependencies',
		'/vendor/',
		'',
	].join('\n');

	it('makes generated Project Config and lockfiles trackable', () => {
		const result = stripStarterOnlyIgnores(content);

		expect(result).not.toContain('/config/project/');
		expect(result).not.toContain('/composer.lock');
		expect(result).not.toContain('/package-lock.json');
		expect(result).toContain('# Dependencies\n/vendor/');
	});

	it('continues ignoring the Craft license key', () => {
		const result = stripStarterOnlyIgnores(content);

		expect(result).toContain('/config/license.key');
	});

	it('is idempotent', () => {
		const once = stripStarterOnlyIgnores(content);
		expect(stripStarterOnlyIgnores(once)).toBe(once);
	});
});

describe('setBuildFilesIgnored', () => {
	const content = [
		'# Dependencies',
		'/vendor/',
		'',
		'# Build files',
		'/web/dist/',
		'',
		'# Web assets',
		'/web/assets/*',
		'',
	].join('\n');

	it('removes the build files section when build files are tracked', () => {
		const result = setBuildFilesIgnored(content, false);
		expect(result).not.toContain('# Build files');
		expect(result).not.toContain('/web/dist/');
		expect(result).toContain('# Web assets');
	});

	it('adds the build files section before web assets when build files are ignored', () => {
		const withoutBuildFiles = content.replace('\n# Build files\n/web/dist/\n', '');
		const result = setBuildFilesIgnored(withoutBuildFiles, true);
		expect(result).toContain('# Build files\n/web/dist/\n\n# Web assets');
	});

	it('does not duplicate the build files section', () => {
		const result = setBuildFilesIgnored(content, true);
		expect(result.match(/\/web\/dist\//g)).toHaveLength(1);
	});

	it('replaces a Craft 5 build ignore with the Craft 6 path', () => {
		const result = setBuildFilesIgnored(content, true, { craftProfile: 'craft6' });
		expect(result).not.toContain('/web/dist/');
		expect(result).toContain('# Build files\n/public/build/');
	});
});

describe('setPlatformPaths', () => {
	it('switches license and runtime paths for Craft 6', () => {
		const input = [
			'# Craft CMS',
			'/config/license.key',
			'',
			'# Web assets',
			'/web/assets/*',
			'/web/cpresources/*',
			'/web/cache/*',
			'/web/transforms/*',
			'',
		].join('\n');
		const result = setPlatformPaths(input, { craftProfile: 'craft6' });

		expect(result).toContain('/config/craft/license.key');
		expect(result).not.toContain('/config/license.key');
		expect(result).toContain('/public/assets/*');
		expect(result).toContain('/public/cpresources/*');
	});
});
