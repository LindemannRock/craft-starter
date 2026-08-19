import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { generateEnvFile, setEnvKey, quoted, removeSection, serializeEnvValue } from '../actions/env.mjs';
import { getDatabaseOption } from '../config/databases.mjs';

const tempDirs = [];

afterEach(() => {
	for (const directory of tempDirs.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

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

	it('escapes backslashes, interpolation, and line breaks', () => {
		expect(serializeEnvValue('path\\')).toBe('"path\\\\"');
		expect(serializeEnvValue('${TOKEN}')).toBe('"\\${TOKEN}"');
		expect(serializeEnvValue('first\r\nsecond')).toBe('"first\\r\\nsecond"');
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

describe('database options', () => {
	it('maps PostgreSQL 18 to Craft driver and port', () => {
		const postgres = getDatabaseOption('postgres');
		expect(postgres.craftDriver).toBe('pgsql');
		expect(postgres.craftPort).toBe('5432');
		expect(postgres.craftSchema).toBe('public');
		expect(postgres.ddevType).toBe('postgres');
		expect(postgres.ddevVersion).toBe('18');
	});

	it('keeps PostgreSQL 16 available as the Craft baseline', () => {
		const postgres = getDatabaseOption('postgres-16');
		expect(postgres.craftDriver).toBe('pgsql');
		expect(postgres.craftPort).toBe('5432');
		expect(postgres.craftSchema).toBe('public');
		expect(postgres.ddevType).toBe('postgres');
		expect(postgres.ddevVersion).toBe('16');
	});
});

describe('profile-aware environment generation', () => {
	it('writes Laravel application, database, and mail variables for Craft 6', () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-env-v6-'));
		tempDirs.push(root);
		const templatePath = path.join(root, 'cli/templates/platforms/craft6/env.example');
		fs.mkdirSync(path.dirname(templatePath), { recursive: true });
		fs.writeFileSync(
			templatePath,
			[
				'APP_NAME=',
				'APP_ENV=',
				'APP_KEY=',
				'APP_DEBUG=',
				'APP_URL=',
				'APP_LOCALE=',
				'CRAFT_TIMEZONE=',
				'CRAFT_CP_TRIGGER=',
				'SYSTEM_NAME=',
				'DB_CONNECTION=',
				'DB_PORT=',
				'DB_SEARCH_PATH=',
				'PRIMARY_SITE_URL=',
				'PRIMARY_SITE_LANGUAGE=',
				'PRIMARY_TRANSLATION_CATEGORY=',
				'MAIL_FROM_ADDRESS=',
				'MAIL_FROM_NAME=',
				'CRAFT_TEST_TO_EMAIL_ADDRESS=',
				'',
			].join('\n'),
		);
		generateEnvFile({
			root,
			craftProfile: 'craft6',
			project: {
				name: 'demo',
				description: 'Demo Site',
				timezone: 'Africa/Cairo',
				cpTrigger: 'cms',
				language: 'en-US',
				systemEmail: 'hello@example.com',
				noReplyEmail: '',
				adminEmail: 'admin@example.com',
			},
			sites: [{ handle: 'en', language: 'en-US', name: 'Demo', label: 'English', urlPrefix: '' }],
			database: {
				craftDriver: 'mysql',
				craftPort: '3306',
				craftSchema: '',
			},
			selectedHosting: { value: 'none' },
			useRedisCache: false,
		});

		const env = fs.readFileSync(path.join(root, '.env'), 'utf-8');
		expect(env).toMatch(/^APP_KEY="base64:[^"]+"$/m);
		expect(env).toContain('APP_NAME="Demo Site"');
		expect(env).toContain('APP_URL=https://demo.ddev.site');
		expect(env).toContain('DB_CONNECTION=mysql');
		expect(env).toContain('MAIL_FROM_ADDRESS="hello@example.com"');
		expect(env).not.toContain('CRAFT_APP_ID=');
		expect(env).not.toContain('CRAFT_SECURITY_KEY=');
	});
});
