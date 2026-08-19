import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
	buildSetupManifest,
	markSetupComplete,
	readSetupManifest,
	writeSetupManifest,
} from '../actions/setupManifest.mjs';

const tempDirs = [];
const tempProject = () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-manifest-test-'));
	tempDirs.push(root);
	return root;
};

afterEach(() => {
	for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('setup manifest', () => {
	const state = {
		project: {
			name: 'demo',
			description: 'Demo',
			timezone: 'UTC',
			language: 'en-US',
			phpVersion: '8.4',
			weekStartDay: 1,
			cpTrigger: 'cms',
			adminEmail: 'admin@example.com',
			adminPassword: 'never-store-me',
			systemEmail: 'info@example.com',
			noReplyEmail: '',
		},
		database: { value: 'mysql' },
		sites: [{ handle: 'english', language: 'en-US', urlPrefix: '', name: 'Demo', label: 'English' }],
		selectedLr: [{ value: 'vendor/search', handle: 'search-manager', version: '^5', edition: 'pro' }],
		selectedTp: [],
		selectedHosting: { value: 'craft-cloud' },
		useRedisCache: true,
		useRedisSession: true,
		translationCategory: 'messages',
		smtpCredentials: {
			host: 'smtp.example.com',
			username: 'secret-user',
			password: 'secret-pass',
			useAuth: true,
			encryption: 'tls',
		},
	};

	it('keeps reproducible choices and excludes credentials', () => {
		const manifest = buildSetupManifest(state);
		const serialized = JSON.stringify(manifest);
		expect(manifest.status).toBe('pending');
		expect(manifest.craft).toEqual({ profile: 'craft5', major: 5, channel: 'stable' });
		expect(manifest.plugins[0]).toMatchObject({ handle: 'search-manager', edition: 'pro' });
		expect(manifest.sites[0].language).toBe('en-US');
		expect(serialized).not.toContain('never-store-me');
		expect(serialized).not.toContain('secret-user');
		expect(serialized).not.toContain('secret-pass');
	});

	it('normalizes manifests created before Craft profiles were introduced', () => {
		const root = tempProject();
		fs.writeFileSync(
			path.join(root, '.craft-starter.json'),
			JSON.stringify({ schemaVersion: 1, status: 'complete', project: { name: 'legacy' } }),
		);
		expect(readSetupManifest({ root }).craft).toEqual({ profile: 'craft5', major: 5, channel: 'stable' });
	});

	it('fails loudly instead of partially loading an unavailable profile', () => {
		const root = tempProject();
		fs.writeFileSync(
			path.join(root, '.craft-starter.json'),
			JSON.stringify({
				schemaVersion: 1,
				status: 'complete',
				craft: { profile: 'craft6', major: 6, channel: 'alpha' },
			}),
		);
		expect(() => readSetupManifest({ root })).toThrow(/Unsupported Craft profile/);
	});

	it('persists pending state and marks it complete atomically', () => {
		const root = tempProject();
		writeSetupManifest(state, { root });
		expect(readSetupManifest({ root }).status).toBe('pending');
		markSetupComplete({ root });
		expect(readSetupManifest({ root }).status).toBe('complete');
		expect(fs.existsSync(path.join(root, '.craft-starter.json.tmp'))).toBe(false);
	});
});
