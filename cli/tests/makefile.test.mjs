import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Makefile setup', () => {
	it('installs CLI dependencies without rewriting their lockfile', () => {
		const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');
		const createTarget = makefile.match(/^create:.*\n(?:\t.*\n)+/m)?.[0];

		expect(createTarget).toContain('cd cli && npm ci');
		expect(createTarget).not.toContain('cd cli && npm install');
	});

	it('declares and locks the YAML version required by Vite', () => {
		const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'cli/package.json'), 'utf8'));
		const lock = JSON.parse(fs.readFileSync(path.join(root, 'cli/package-lock.json'), 'utf8'));

		expect(packageJson.devDependencies.yaml).toBe('^2.9.0');
		expect(lock.packages['node_modules/yaml']?.version).toBe('2.9.0');
	});

	it('does not infer plugin installation state from the human-readable Craft table', () => {
		const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');
		expect(makefile).not.toContain('plugin/list --installed');
		expect(makefile).toContain('node cli/scripts/install-plugins.mjs');
	});

	it('delegates destructive lifecycle commands to the tested script', () => {
		const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');
		expect(makefile).toContain('node cli/scripts/lifecycle.mjs reset');
		expect(makefile).toContain('node cli/scripts/lifecycle.mjs nuke');
		expect(makefile).not.toContain('git checkout');
	});
});
