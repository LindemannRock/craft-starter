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
});
