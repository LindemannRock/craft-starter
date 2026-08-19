/** Safe project lifecycle operations shared by Make and the interactive CLI. */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { ROOT, CLI_DIR } from '../paths.mjs';
import { removeRedisAddonFiles } from './redis.mjs';

export function deleteDdevProject({ root = ROOT } = {}) {
	try {
		execFileSync('ddev', ['delete', '-Oy'], { cwd: root, stdio: 'ignore' });
	} catch {
		// The project may not be registered or DDEV may already be stopped.
	}
}

/** Remove installation identity/state while preserving all project source. */
export function resetProject({ root = ROOT, deleteDdev = true } = {}) {
	if (deleteDdev) deleteDdevProject({ root });
	for (const target of [path.join(root, '.env'), path.join(root, 'config', 'project'), path.join(root, 'cli', 'tmp')]) {
		fs.rmSync(target, { recursive: true, force: true });
	}
}

/** Remove reproducible local runtime artifacts without touching project definition. */
export function nukeRuntime({ root = ROOT, deleteDdev = true } = {}) {
	if (deleteDdev) deleteDdevProject({ root });
	for (const target of [
		path.join(root, 'vendor'),
		path.join(root, 'node_modules'),
		path.join(root, 'web', 'dist'),
		path.join(root, 'storage', 'logs'),
		path.join(root, 'storage', 'runtime'),
	]) {
		fs.rmSync(target, { recursive: true, force: true });
	}
}

export function isOriginalStarterRepository({ root = ROOT } = {}) {
	try {
		const remote = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
			cwd: root,
			encoding: 'utf-8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
		return /(?:^|[/:])LindemannRock\/craft-starter(?:\.git)?$/i.test(remote);
	} catch {
		return false;
	}
}

/** Developer-only return to the committed starter scaffold. */
export function resetStarterScaffold({ root = ROOT } = {}) {
	if (!isOriginalStarterRepository({ root })) {
		throw new Error('starter-reset is only available in the original LindemannRock/craft-starter repository.');
	}

	deleteDdevProject({ root });
	const tracked = [
		'.ddev/config.yaml',
		'.ddev/config.m1.yaml',
		'.gitignore',
		'composer.json',
		'package.json',
		'config/general.php',
		'config/vite.php',
		'templates/_boilerplate/_partials/critical-css.twig',
		'templates/_layouts/global-variables.twig',
	];
	execFileSync('git', ['restore', '--source=HEAD', '--', ...tracked], { cwd: root, stdio: 'inherit' });

	resetProject({ root, deleteDdev: false });
	nukeRuntime({ root, deleteDdev: false });
	removeRedisAddonFiles({ root });
	for (const target of [
		path.join(root, '.craft-starter.json'),
		path.join(root, 'composer.lock'),
		path.join(root, 'package-lock.json'),
		path.join(root, 'craft-cloud.yaml'),
	]) {
		fs.rmSync(target, { recursive: true, force: true });
	}

	const pluginTemplates = path.join(CLI_DIR, 'templates', 'plugins');
	for (const filename of fs.readdirSync(pluginTemplates)) {
		fs.rmSync(path.join(root, 'config', filename), { force: true });
	}
	const translations = path.join(root, 'translations');
	if (fs.existsSync(translations)) {
		for (const entry of fs.readdirSync(translations, { withFileTypes: true })) {
			if (entry.isDirectory() || entry.name === '.DS_Store') {
				fs.rmSync(path.join(translations, entry.name), { recursive: true, force: true });
			}
		}
	}
}
