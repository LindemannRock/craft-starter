/** Safe project lifecycle operations shared by Make and the interactive CLI. */

import fs from 'fs';
import path from 'path';
import {execFileSync} from 'child_process';
import {ROOT, CLI_DIR} from '../paths.mjs';
import {removeRedisAddonFiles} from './redis.mjs';
import {DEFAULT_CRAFT_PROFILE, craftProjectPath, resolveCraftProfile} from '../config/craft-profiles.mjs';

export function deleteDdevProject({root = ROOT} = {}) {
	try {
		execFileSync('ddev', ['delete', '-Oy'], {cwd: root, stdio: 'ignore'});
	} catch {
		// The project may not be registered or DDEV may already be stopped.
	}
}

/** Remove installation identity/state while preserving all project source. */
export function resetProject({root = ROOT, deleteDdev = true, craftProfile} = {}) {
	const profile = resolveCraftProfile(craftProfile);
	if (deleteDdev) deleteDdevProject({root});
	for (const target of [
		path.join(root, '.env'),
		craftProjectPath(root, 'projectConfig', profile),
		path.join(root, 'cli', 'tmp'),
	]) {
		fs.rmSync(target, {recursive: true, force: true});
	}
}

/** Remove reproducible local runtime artifacts without touching project definition. */
export function nukeRuntime({root = ROOT, deleteDdev = true, craftProfile} = {}) {
	const profile = resolveCraftProfile(craftProfile);
	if (deleteDdev) deleteDdevProject({root});
	for (const target of [
		path.join(root, 'vendor'),
		path.join(root, 'node_modules'),
		craftProjectPath(root, 'build', profile),
	]) {
		fs.rmSync(target, {recursive: true, force: true});
	}
	for (const directory of profile.paths.runtimeDirectories) {
		clearRuntimeDirectory(path.join(root, directory));
	}
}

function clearRuntimeDirectory(directory) {
	if (!fs.existsSync(directory)) return;
	const keepGitignore = fs.existsSync(path.join(directory, '.gitignore'));
	if (!keepGitignore) {
		fs.rmSync(directory, {recursive: true, force: true});
		return;
	}
	for (const entry of fs.readdirSync(directory)) {
		if (entry !== '.gitignore') fs.rmSync(path.join(directory, entry), {recursive: true, force: true});
	}
}

function gitOutput(args, {root = ROOT} = {}) {
	try {
		return execFileSync('git', args, {
			cwd: root,
			encoding: 'utf-8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
	} catch {
		return null;
	}
}

export function hasCommittedGitBaseline({root = ROOT} = {}) {
	return (
		gitOutput(['rev-parse', '--is-inside-work-tree'], {root}) === 'true' &&
		Boolean(gitOutput(['rev-parse', '--verify', 'HEAD'], {root}))
	);
}

export function isStarterMaintenanceEnabled({root = ROOT} = {}) {
	if (!hasCommittedGitBaseline({root})) return false;
	const remote = gitOutput(['config', '--get', 'remote.origin.url'], {root}) || '';
	if (/(?:^|[/:])LindemannRock\/craft-starter(?:\.git)?$/i.test(remote)) return true;
	return gitOutput(['config', '--local', '--bool', '--get', 'craft-starter.maintenance'], {root}) === 'true';
}

export function assertStarterMaintenanceEnabled({root = ROOT} = {}) {
	if (!hasCommittedGitBaseline({root})) {
		throw new Error(
			'Cannot restore the starter without a committed Git baseline. If you downloaded a ZIP for starter development, run `git init`, commit the untouched scaffold, then enable maintenance with `git config --local craft-starter.maintenance true`.',
		);
	}
	if (!isStarterMaintenanceEnabled({root})) {
		throw new Error(
			'Reset is disabled for this repository. If this is a maintained starter fork, enable it with `git config --local craft-starter.maintenance true`.',
		);
	}
}

/** Maintainer-only return to the committed starter scaffold. */
export function resetStarterScaffold({root = ROOT, craftProfile, deleteDdev = true} = {}) {
	const activeProfile = resolveCraftProfile(craftProfile);
	assertStarterMaintenanceEnabled({root});

	if (deleteDdev) deleteDdevProject({root});
	const tracked = [
		'.ddev/config.yaml',
		'.ddev/config.m1.yaml',
		'.gitignore',
		'composer.json',
		'package.json',
		'vite.config.mjs',
		'bootstrap.php',
		'craft',
		'config',
		'templates',
		'translations',
		'web',
		'storage/.gitignore',
	];
	execFileSync('git', ['restore', '--source=HEAD', '--', ...tracked], {cwd: root, stdio: 'inherit'});
	for (const target of activeProfile.scaffold?.cleanup || []) {
		fs.rmSync(path.join(root, target), {recursive: true, force: true});
	}

	const profile = DEFAULT_CRAFT_PROFILE;
	resetProject({root, deleteDdev: false, craftProfile: profile});
	nukeRuntime({root, deleteDdev: false, craftProfile: profile});
	removeRedisAddonFiles({root});
	for (const target of [
		path.join(root, '.craft-starter.json'),
		path.join(root, 'composer.lock'),
		path.join(root, 'package-lock.json'),
		path.join(root, 'craft-cloud.yaml'),
	]) {
		fs.rmSync(target, {recursive: true, force: true});
	}

	const pluginTemplates = path.join(CLI_DIR, 'templates', 'plugins');
	const pluginConfigDir = craftProjectPath(root, 'pluginConfig', profile);
	for (const filename of fs.readdirSync(pluginTemplates)) {
		fs.rmSync(path.join(pluginConfigDir, filename), {force: true});
	}
	const translations = craftProjectPath(root, 'translations', profile);
	if (fs.existsSync(translations)) {
		for (const entry of fs.readdirSync(translations, {withFileTypes: true})) {
			if (entry.isDirectory() || entry.name === '.DS_Store') {
				fs.rmSync(path.join(translations, entry.name), {recursive: true, force: true});
			}
		}
	}
}
