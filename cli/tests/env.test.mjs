import { describe, it, expect, vi } from 'vitest';
import { setEnvKey, quoted, removeSection } from '../actions/env.mjs';

describe('setEnvKey', () => {
	it('replaces an existing key', () => {
		const result = setEnvKey('FOO=old\nBAR=keep\n', 'FOO', 'new');
		expect(result).toBe('FOO=new\nBAR=keep\n');
	});

	it('appends a missing key (warns about typo)', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = setEnvKey('FOO=bar\n', 'NEW_KEY', 'val');
		expect(result).toContain('NEW_KEY=val');
		expect(warn).toHaveBeenCalledOnce();
		warn.mockRestore();
	});

	it('handles $ characters in values (critical audit fix)', () => {
		const result = setEnvKey('TOKEN=old\n', 'TOKEN', 'live_$&_test');
		expect(result).toBe('TOKEN=live_$&_test\n');
	});

	it('handles $1 backreference pattern in values', () => {
		const result = setEnvKey('NAME=old\n', 'NAME', 'Acme $1 Corp');
		expect(result).toBe('NAME=Acme $1 Corp\n');
	});

	it('handles empty value', () => {
		const result = setEnvKey('KEY=old\n', 'KEY', '');
		expect(result).toBe('KEY=\n');
	});

	it('does not match partial key names', () => {
		const content = 'FOO_BAR=keep\nFOO=replace\n';
		const result = setEnvKey(content, 'FOO', 'new');
		expect(result).toContain('FOO_BAR=keep');
		expect(result).toContain('FOO=new');
	});
});

describe('quoted', () => {
	it('wraps in double quotes', () => {
		expect(quoted('hello')).toBe('"hello"');
	});

	it('escapes internal double quotes', () => {
		expect(quoted('say "hi"')).toBe('"say \\"hi\\""');
	});

	it('handles empty string', () => {
		expect(quoted('')).toBe('""');
	});
});

describe('removeSection', () => {
	const content = [
		'',
		'# Section A',
		'KEY_A=val',
		'',
		'# Section B',
		'KEY_B1=val',
		'KEY_B2=val',
		'',
		'# Section C',
		'KEY_C=val',
		'',
	].join('\n');

	it('removes a section by header', () => {
		const result = removeSection(content, '# Section B');
		expect(result).not.toContain('KEY_B1');
		expect(result).not.toContain('KEY_B2');
		expect(result).not.toContain('# Section B');
	});

	it('preserves other sections', () => {
		const result = removeSection(content, '# Section B');
		expect(result).toContain('KEY_A=val');
		expect(result).toContain('KEY_C=val');
	});

	it('stops at blank line (does not eat next section)', () => {
		const result = removeSection(content, '# Section A');
		expect(result).toContain('# Section B');
		expect(result).toContain('KEY_B1=val');
	});

	it('returns content unchanged for non-existent section', () => {
		const result = removeSection(content, '# Non-existent');
		expect(result).toBe(content);
	});
});
