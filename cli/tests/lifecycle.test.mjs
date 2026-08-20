import fs from 'fs';
import os from 'os';
import path from 'path';
import {execFileSync} from 'child_process';
import {afterEach, describe, expect, it} from 'vitest';
import {
	assertStarterMaintenanceEnabled,
	isStarterMaintenanceEnabled,
	nukeRuntime,
	resetProject,
	resetStarterScaffold,
} from '../actions/lifecycle.mjs';

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
		fs.mkdirSync(path.join(root, directory), {recursive: true});
		fs.writeFileSync(path.join(root, directory, 'fixture.txt'), 'fixture');
	}
	for (const filename of ['.env', '.craft-starter.json', 'composer.lock', 'package-lock.json', 'craft-cloud.yaml']) {
		fs.writeFileSync(path.join(root, filename), filename);
	}
	return root;
}

afterEach(() => {
	for (const dir of tempDirs.splice(0)) fs.rmSync(dir, {recursive: true, force: true});
});

describe('project lifecycle', () => {
	it('automatically enables maintenance for the official repository', () => {
		const root = committedRepository('git@github.com:LindemannRock/craft-starter.git');
		expect(isStarterMaintenanceEnabled({root})).toBe(true);
	});

	it('requires an explicit local opt-in for maintained forks', () => {
		const root = committedRepository('git@github.com:example/craft-starter.git');
		expect(isStarterMaintenanceEnabled({root})).toBe(false);
		expect(() => assertStarterMaintenanceEnabled({root})).toThrow('git config --local craft-starter.maintenance true');

		execFileSync('git', ['config', '--local', 'craft-starter.maintenance', 'true'], {cwd: root});
		expect(isStarterMaintenanceEnabled({root})).toBe(true);
	});

	it('requires ZIP downloads to create a committed baseline', () => {
		const root = fixture();
		expect(isStarterMaintenanceEnabled({root})).toBe(false);
		expect(() => assertStarterMaintenanceEnabled({root})).toThrow('committed Git baseline');
	});

	it('nukes runtime while preserving the project definition', () => {
		const root = fixture();
		nukeRuntime({root, deleteDdev: false});
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
		resetProject({root, deleteDdev: false});
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
			fs.mkdirSync(path.join(root, directory), {recursive: true});
			fs.writeFileSync(path.join(root, directory, '.gitignore'), '*\n!.gitignore\n');
			fs.writeFileSync(path.join(root, directory, 'runtime.php'), 'generated');
		}

		nukeRuntime({root, deleteDdev: false, craftProfile: 'craft6'});
		expect(fs.existsSync(path.join(root, 'public/build'))).toBe(false);
		for (const directory of ['bootstrap/cache', 'storage/framework/views']) {
			expect(fs.existsSync(path.join(root, directory, '.gitignore'))).toBe(true);
			expect(fs.existsSync(path.join(root, directory, 'runtime.php'))).toBe(false);
		}
	});

	it('restores the committed starter baseline from a generated Craft 6 project', () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-starter-reset-test-'));
		tempDirs.push(root);
		const baseline = {
			'.ddev/config.yaml': 'name: starter\n',
			'.ddev/config.m1.yaml': 'baseline: true\n',
			'.gitignore': '.env\n',
			'composer.json': '{"name":"starter/baseline"}\n',
			'package.json': '{"name":"starter-baseline"}\n',
			'vite.config.mjs': 'export default { baseline: true };\n',
			'bootstrap.php': '<?php // baseline\n',
			craft: '#!/usr/bin/env php\n',
			'config/general.php': '<?php return [];\n',
			'templates/index.twig': 'baseline\n',
			'translations/.gitkeep': '',
			'web/index.php': '<?php // baseline\n',
			'storage/.gitignore': '*\n!.gitignore\n',
		};

		for (const [filename, content] of Object.entries(baseline)) {
			fs.mkdirSync(path.dirname(path.join(root, filename)), {recursive: true});
			fs.writeFileSync(path.join(root, filename), content);
		}
		execFileSync('git', ['init', '-q'], {cwd: root});
		execFileSync('git', ['config', 'user.name', 'Test'], {cwd: root});
		execFileSync('git', ['config', 'user.email', 'test@example.com'], {cwd: root});
		execFileSync('git', ['remote', 'add', 'origin', 'git@github.com:LindemannRock/craft-starter.git'], {cwd: root});
		execFileSync('git', ['add', '.'], {cwd: root});
		execFileSync('git', ['commit', '-qm', 'baseline'], {cwd: root});

		fs.writeFileSync(path.join(root, 'composer.json'), '{"name":"generated/craft6"}\n');
		fs.writeFileSync(path.join(root, 'vite.config.mjs'), 'export default { generated: true };\n');
		for (const filename of [
			'.env',
			'.craft-starter.json',
			'composer.lock',
			'package-lock.json',
			'app/generated.php',
			'public/build/manifest.json',
			'config/craft/project/project.yaml',
		]) {
			fs.mkdirSync(path.dirname(path.join(root, filename)), {recursive: true});
			fs.writeFileSync(path.join(root, filename), 'generated\n');
		}

		resetStarterScaffold({root, craftProfile: 'craft6', deleteDdev: false});

		expect(fs.readFileSync(path.join(root, 'composer.json'), 'utf8')).toBe(baseline['composer.json']);
		expect(fs.readFileSync(path.join(root, 'vite.config.mjs'), 'utf8')).toBe(baseline['vite.config.mjs']);
		expect(fs.readFileSync(path.join(root, 'web/index.php'), 'utf8')).toBe(baseline['web/index.php']);
		for (const removed of ['.env', '.craft-starter.json', 'composer.lock', 'package-lock.json', 'app', 'public']) {
			expect(fs.existsSync(path.join(root, removed))).toBe(false);
		}
	});
});

function committedRepository(remote) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-starter-maintenance-test-'));
	tempDirs.push(root);
	fs.writeFileSync(path.join(root, 'README.md'), 'baseline\n');
	execFileSync('git', ['init', '-q'], {cwd: root});
	execFileSync('git', ['config', 'user.name', 'Test'], {cwd: root});
	execFileSync('git', ['config', 'user.email', 'test@example.com'], {cwd: root});
	execFileSync('git', ['remote', 'add', 'origin', remote], {cwd: root});
	execFileSync('git', ['add', '.'], {cwd: root});
	execFileSync('git', ['commit', '-qm', 'baseline'], {cwd: root});
	return root;
}
