import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateEnvFile } from '../actions/env.mjs';
import { LR_PLUGINS } from '../config/plugins.mjs';

const tempDirs = [];
const plugin = (handle) => LR_PLUGINS.find((item) => item.handle === handle);

afterEach(() => {
	for (const directory of tempDirs.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function generate({ selectedLr = [], geoFallback = null } = {}) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-plugin-env-'));
	tempDirs.push(root);
	const templateDir = path.join(root, 'cli/templates');
	fs.mkdirSync(templateDir, { recursive: true });
	fs.copyFileSync(new URL('../templates/env.example', import.meta.url), path.join(templateDir, 'env.example'));
	generateEnvFile({
		root,
		project: {
			name: 'demo',
			description: 'Demo',
			timezone: 'UTC',
			language: 'en',
			cpTrigger: 'cms',
			adminEmail: 'admin@example.com',
			systemEmail: 'info@example.com',
		},
		sites: [{ handle: 'en', language: 'en', name: 'Demo', label: 'English', urlPrefix: '' }],
		selectedLr,
		selectedHosting: { value: 'none' },
		useRedisCache: false,
		geoFallback,
	});
	return fs.readFileSync(path.join(root, '.env'), 'utf-8');
}

describe('LR plugin environment generation', () => {
	it('applies one supported fallback and unique salts to all selected managers', () => {
		const handles = ['redirect-manager', 'search-manager', 'shortlink-manager', 'smartlink-manager'];
		const env = generate({ selectedLr: handles.map(plugin), geoFallback: { country: 'AE', city: 'Abu Dhabi' } });
		for (const handle of handles) {
			const definition = plugin(handle);
			expect(env).toMatch(new RegExp(`^${definition.ipSaltEnv}="[0-9a-f]{64}"$`, 'm'));
			expect(env).toMatch(new RegExp(`^${definition.geoEnv.country}=AE$`, 'm'));
			expect(env).toMatch(new RegExp(`^${definition.geoEnv.city}="Abu Dhabi"$`, 'm'));
		}
		const salts = [...env.matchAll(/_IP_SALT="([0-9a-f]{64})"/g)].map((match) => match[1]);
		expect(new Set(salts).size).toBe(4);
	});

	it('leaves the selected manager location unset when the fallback is declined', () => {
		const env = generate({ selectedLr: [plugin('search-manager')] });
		expect(env).toMatch(/^SEARCH_MANAGER_DEFAULT_COUNTRY=$/m);
		expect(env).toMatch(/^SEARCH_MANAGER_DEFAULT_CITY=$/m);
		expect(env).not.toContain('REDIRECT_MANAGER_DEFAULT_COUNTRY');
	});

	it('allows Search Manager to use one of its additional locations when selected alone', () => {
		const env = generate({
			selectedLr: [plugin('search-manager')],
			geoFallback: { country: 'NL', city: 'Amsterdam' },
		});
		expect(env).toMatch(/^SEARCH_MANAGER_DEFAULT_COUNTRY=NL$/m);
		expect(env).toMatch(/^SEARCH_MANAGER_DEFAULT_CITY="Amsterdam"$/m);
	});

	it('does not scaffold obsolete Formie REST API or SAP credentials', () => {
		const env = generate({ selectedLr: [plugin('formie-rest-api')] });
		expect(env).not.toContain('FORMIE_API_KEY');
		expect(env).not.toContain('FORMIE_SAP_');
	});

	it('rejects a fallback that is not supported by every selected manager', () => {
		expect(() =>
			generate({
				selectedLr: [plugin('search-manager'), plugin('redirect-manager')],
				geoFallback: { country: 'NL', city: 'Amsterdam' },
			}),
		).toThrow(/Unsupported local analytics fallback/);
	});
});
