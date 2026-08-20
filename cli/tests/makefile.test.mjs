import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {describe, expect, it} from 'vitest';

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

	it('exposes one unambiguous starter reset command', () => {
		const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');
		expect(makefile).toContain('node cli/scripts/lifecycle.mjs reset');
		expect(makefile).not.toMatch(/^nuke:/m);
		expect(makefile).not.toMatch(/^starter-reset:/m);
		expect(makefile).not.toContain('git checkout');
	});

	it('uses the consolidated build and repair command surface', () => {
		const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');
		expect(makefile).toMatch(/^build:.*##/m);
		expect(makefile).toMatch(/^build-critical:.*##/m);
		expect(makefile).toContain('node cli/scripts/check-profile-feature.mjs criticalCss');
		expect(makefile).toMatch(/^repair:.*##/m);
		expect(makefile).not.toMatch(/^(dev|prod|critical|clean|clean-logs|kill-vite):/m);
		expect(makefile).toContain('repair-dependencies:');
		expect(makefile).toContain('repair-logs:');
		expect(makefile).toContain('repair-vite:');
	});

	it('repairs dependencies reproducibly from lockfiles', () => {
		const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');
		const target = makefile.match(/^repair-dependencies:.*\n(?:\t.*\n)+/m)?.[0];
		expect(target).toContain('rm -rf vendor/ node_modules/');
		expect(target).toContain('set -e;');
		expect(target).toContain('ddev composer install');
		expect(target).toContain('ddev exec -- npm ci $(NPM_INSTALL_FLAGS)');
		expect(target).toContain('ddev exec -- npm install $(NPM_INSTALL_FLAGS)');
	});

	it('delegates Craft commands and generated asset paths through the active profile', () => {
		const makefile = fs.readFileSync(path.join(root, 'Makefile'), 'utf8');
		expect(makefile).toContain('node cli/scripts/run-profile-command.mjs schema-version');
		expect(makefile).toContain('node cli/scripts/run-profile-command.mjs up');
		expect(makefile).toContain('node cli/scripts/configure-project.mjs');
		expect(makefile).toContain('node cli/scripts/sync-static-assets.mjs');
		expect(makefile).not.toContain('[ ! -d web/dist/criticalcss ]');
	});
});
