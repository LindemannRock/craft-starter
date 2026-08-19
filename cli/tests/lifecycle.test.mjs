import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { nukeRuntime, resetProject } from '../actions/lifecycle.mjs';

const tempDirs = [];
function fixture() {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-lifecycle-test-'));
	tempDirs.push(root);
	for (const directory of [
		'vendor',
		'node_modules',
		'web/dist',
		'storage/runtime',
		'config/project',
		'translations/en-US',
	]) {
		fs.mkdirSync(path.join(root, directory), { recursive: true });
		fs.writeFileSync(path.join(root, directory, 'fixture.txt'), 'fixture');
	}
	for (const filename of ['.env', '.craft-starter.json', 'composer.lock', 'package-lock.json', 'craft-cloud.yaml']) {
		fs.writeFileSync(path.join(root, filename), filename);
	}
	return root;
}

afterEach(() => {
	for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('project lifecycle', () => {
	it('nukes runtime while preserving the project definition', () => {
		const root = fixture();
		nukeRuntime({ root, deleteDdev: false });
		for (const removed of ['vendor', 'node_modules', 'web/dist', 'storage/runtime']) {
			expect(fs.existsSync(path.join(root, removed))).toBe(false);
		}
		for (const preserved of [
			'.env',
			'.craft-starter.json',
			'composer.lock',
			'package-lock.json',
			'craft-cloud.yaml',
			'config/project',
			'translations/en-US',
		]) {
			expect(fs.existsSync(path.join(root, preserved))).toBe(true);
		}
	});

	it('fully resets installation state without changing project source', () => {
		const root = fixture();
		resetProject({ root, deleteDdev: false });
		expect(fs.existsSync(path.join(root, '.env'))).toBe(false);
		expect(fs.existsSync(path.join(root, 'config/project'))).toBe(false);
		for (const preserved of [
			'.craft-starter.json',
			'composer.lock',
			'package-lock.json',
			'craft-cloud.yaml',
			'translations/en-US',
		]) {
			expect(fs.existsSync(path.join(root, preserved))).toBe(true);
		}
	});

	it('clears Craft 6 Laravel runtime files while preserving tracked placeholders', () => {
		const root = fixture();
		for (const directory of ['public/build', 'bootstrap/cache', 'storage/framework/views']) {
			fs.mkdirSync(path.join(root, directory), { recursive: true });
			fs.writeFileSync(path.join(root, directory, '.gitignore'), '*\n!.gitignore\n');
			fs.writeFileSync(path.join(root, directory, 'runtime.php'), 'generated');
		}

		nukeRuntime({ root, deleteDdev: false, craftProfile: 'craft6' });
		expect(fs.existsSync(path.join(root, 'public/build'))).toBe(false);
		for (const directory of ['bootstrap/cache', 'storage/framework/views']) {
			expect(fs.existsSync(path.join(root, directory, '.gitignore'))).toBe(true);
			expect(fs.existsSync(path.join(root, directory, 'runtime.php'))).toBe(false);
		}
	});
});
