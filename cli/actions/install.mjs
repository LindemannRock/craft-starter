/**
 * The actual install pipeline — DDEV, Composer, NPM, Craft, plugin activation.
 *
 * Returns a list of step descriptors that the orchestrator runs with a spinner.
 * Each step is either a shell `cmd` or an async `fn`.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ROOT } from '../paths.mjs';
import { run } from '../utils/run.mjs';
import { activatePlugins } from './plugins.mjs';
import { configureEmailTransport } from './projectConfig.mjs';
import { CORE_PLUGIN_HANDLES } from '../config/plugins.mjs';
import { shellEscape } from '../utils/validate.mjs';

/**
 * Returns true if Craft is already installed (has a schemaVersion in project config).
 *
 */
function isCraftInstalled() {
	try {
		const out = execSync('ddev exec php craft project-config/get system.schemaVersion', {
			cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'],
		}).toString().trim();
		return /^\d+\./.test(out);
	} catch {
		return false;
	}
}

export function buildInstallSteps({ project, selectedLr, selectedTp, selectedHosting, useRedisCache }) {
	const siteName = project.description || project.name;
	const siteUrl = `https://${project.name}.ddev.site`;

	const pluginHandles = [
		...CORE_PLUGIN_HANDLES,
		...selectedLr.map((pl) => pl.handle).filter(Boolean),
		...selectedTp.map((pl) => pl.handle).filter(Boolean),
		...selectedHosting.packages.map((pkg) => pkg.handle).filter(Boolean),
	];

	const steps = [
		// Clear stale artifacts from previous runs BEFORE ddev start.
		// The .env file is already written by generateEnvFile() in the orchestrator.
		{
			msg: 'Cleaning stale artifacts',
			fn: () => {
				// Clear stale project config from previous runs
				const projectDir = path.join(ROOT, 'config', 'project');
				if (fs.existsSync(projectDir)) {
					fs.rmSync(projectDir, { recursive: true });
				}

				// Clear stale lock files (composer.json just changed)
				for (const lockFile of ['composer.lock', 'package-lock.json']) {
					const lockPath = path.join(ROOT, lockFile);
					if (fs.existsSync(lockPath)) {
						fs.rmSync(lockPath);
					}
				}
			},
		},
	];

	// Install the Redis DDEV addon BEFORE ddev start so the Redis container boots with the project
	if (useRedisCache) {
		steps.push({ msg: 'Adding DDEV Redis addon', cmd: 'ddev add-on get ddev/ddev-redis' });
	}

	steps.push(
		{ msg: 'Starting DDEV environment', cmd: 'ddev start' },
		{ msg: 'Installing PHP dependencies', cmd: 'ddev composer install --no-interaction --quiet' },
		{ msg: 'Installing Node dependencies', cmd: 'ddev exec -- npm install --include=optional --legacy-peer-deps --silent' },
		{
			msg: 'Installing Craft CMS',
			fn: async () => {
				if (isCraftInstalled()) return 'skipped';
				await run(
					`ddev exec php craft install` +
					` --interactive=0` +
					` --email=${shellEscape(project.adminEmail)}` +
					` --password=${shellEscape(project.adminPassword)}` +
					` --site-name=${shellEscape(siteName)}` +
					` --site-url=${shellEscape(siteUrl)}` +
					` --language=${shellEscape(project.language)}`,
				);
			},
		},
		{
			msg: `Activating ${pluginHandles.length} plugin${pluginHandles.length === 1 ? '' : 's'}`,
			fn: () => activatePlugins(pluginHandles),
		},
		{ msg: 'Applying project config', cmd: 'ddev exec php craft up --interactive=0' },
		// Email transport — runs AFTER craft up so the PHP script boots a
		// fully-synced Craft. The script reads env vars directly and picks
		// Postmark / SMTP / Mailpit automatically.
		{
			msg: 'Configuring email transport',
			fn: () => configureEmailTransport(),
		},
	);

	return steps;
}
