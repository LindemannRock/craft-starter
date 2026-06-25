import { describe, it, expect } from 'vitest';
import { setBuildFilesIgnored } from '../actions/gitignore.mjs';

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
});
