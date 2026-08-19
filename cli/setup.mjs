#!/usr/bin/env node

/**
 * LindemannRock Craft CMS Starter — Interactive Setup (orchestrator)
 *
 * Walks the user through the setup prompts, applies configuration changes,
 * and runs the install pipeline (DDEV + Composer + NPM + Craft).
 *
 * All logic lives in ./prompts, ./actions, ./config, and ./utils — this file
 * just wires them together in order.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { HOSTING_OPTIONS, LR_PLUGINS, THIRD_PARTY_PLUGINS } from './config/plugins.mjs';
import { promptProject } from './prompts/project.mjs';
import { promptLrPlugins, promptThirdPartyPlugins, promptHosting, promptPluginEditions } from './prompts/plugins.mjs';
import { getSiteUrlConflicts, promptSites } from './prompts/sites.mjs';
import { promptServdCredentials } from './prompts/servd.mjs';
import { promptHostingEmail } from './prompts/hosting-email.mjs';
import { promptPostmarkToken } from './prompts/postmark.mjs';
import { promptTranslationCategory } from './prompts/translation-manager.mjs';
import { promptRedis } from './prompts/redis.mjs';
import { promptCritical } from './prompts/critical.mjs';
import { promptBuildFiles } from './prompts/build-files.mjs';
import { promptCraftPlatform } from './prompts/craft.mjs';
import { updateComposer } from './actions/composer.mjs';
import { updatePackageJson } from './actions/packageJson.mjs';
import { updateDdevConfig } from './actions/ddev.mjs';
import { setPhpVersion } from './actions/php.mjs';
import { applyCriticalCssChoice } from './actions/critical.mjs';
import { updateGitignore } from './actions/gitignore.mjs';
import { applyCraftCloudDefaults, reconcileCraftCloudConfig } from './actions/cloud.mjs';
import { generateEnvFile } from './actions/env.mjs';
import { writePluginConfigs, cleanUnusedPluginConfigs, syncLrBaseConfig } from './actions/plugins.mjs';
import { scaffoldTranslations, cleanUnusedTranslations } from './actions/sites.mjs';
import { removeRedisAddonFiles } from './actions/redis.mjs';
import {
	buildSetupManifest,
	markSetupComplete,
	readSetupManifest,
	writeSetupManifest,
} from './actions/setupManifest.mjs';
import { resetProject } from './actions/lifecycle.mjs';
import { buildInstallSteps } from './actions/install.mjs';
import { syncRebrandAssets } from './actions/assets.mjs';
import { applyPlatformScaffold } from './actions/platform.mjs';
import { intro, showConfigurationSummary, outro } from './ui.mjs';
import fs from 'fs';
import { cancel } from './utils/cancel.mjs';
import { run } from './utils/run.mjs';
import { checkPrerequisites } from './utils/preflight.mjs';
import { ROOT } from './paths.mjs';
import {
	DEFAULT_CRAFT_PROFILE,
	catalogForCraftProfile,
	craftProjectPath,
	pluginsForCraftProfile,
	resolveCraftProfile,
} from './config/craft-profiles.mjs';

// Phase collectors — each one updates `state` in place. Extracted so the review
// loop can re-run a single section without re-asking everything else.

async function collectProject(state) {
	state.project = await promptProject({ craftProfile: state.craftProfile });
	state.database = state.project.database;
}

async function collectSitesAndFeatures(state) {
	state.sites = await promptSites(state.project?.description || state.project?.name, {
		cpTrigger: state.project?.cpTrigger || 'cms',
	});
	if (state.craftProfile.features.redis) {
		const redis = await promptRedis();
		state.useRedisCache = redis.useRedisCache;
		state.useRedisSession = redis.useRedisSession;
	} else {
		state.useRedisCache = false;
		state.useRedisSession = false;
		p.log.info(`Redis setup is not enabled yet for the experimental ${state.craftProfile.label} profile.`);
	}
	state.useCritical = state.craftProfile.features.criticalCss ? await promptCritical() : false;
	state.commitBuildFiles = await promptBuildFiles({ craftProfile: state.craftProfile });
}

async function collectPlugins(state) {
	const lrCatalog = pluginsForCraftProfile(LR_PLUGINS, state.craftProfile);
	const thirdPartyCatalog = pluginsForCraftProfile(THIRD_PARTY_PLUGINS, state.craftProfile);
	if (!state.craftProfile.features.plugins) {
		state.selectedLr = [];
		state.selectedTp = [];
		p.log.info(`Plugin selection is disabled while ${state.craftProfile.label} compatibility is being verified.`);
		return;
	}
	state.selectedLr = await promptLrPlugins(lrCatalog);
	state.selectedTp = await promptThirdPartyPlugins(thirdPartyCatalog);

	// Auto-add dependencies for selected plugins
	const hasFormieAddon = state.selectedLr.some((pl) => pl.handle.startsWith('formie-'));
	const hasFormie = state.selectedTp.some((pl) => pl.handle === 'formie');
	if (hasFormieAddon && !hasFormie) {
		const formiePlugin = thirdPartyCatalog.find((pl) => pl.handle === 'formie');
		if (formiePlugin) {
			state.selectedTp.push({ ...formiePlugin, autoAdded: 'Formie addon(s)' });
			p.log.info('Formie auto-added — required by selected Formie addon(s)');
		}
	}

	const hasFormieSms = state.selectedLr.some((pl) => pl.handle === 'formie-sms');
	const hasSmsManager = state.selectedLr.some((pl) => pl.handle === 'sms-manager');
	if (hasFormieSms && !hasSmsManager) {
		const smsPlugin = lrCatalog.find((pl) => pl.handle === 'sms-manager');
		if (smsPlugin) {
			state.selectedLr.push({ ...smsPlugin, autoAdded: 'Formie SMS' });
			p.log.info('SMS Manager auto-added — required by Formie SMS');
		}
	}

	state.selectedLr = await promptPluginEditions(state.selectedLr);
	state.selectedTp = await promptPluginEditions(state.selectedTp);
}

async function collectPluginConfig(state) {
	state.translationCategory = null;

	const hasTranslationManager = [...state.selectedLr, ...state.selectedTp].some(
		(pl) => pl.handle === 'translation-manager',
	);
	if (hasTranslationManager) {
		state.translationCategory = await promptTranslationCategory();
	}
}

async function collectHosting(state) {
	state.selectedHosting = await promptHosting(catalogForCraftProfile(HOSTING_OPTIONS, state.craftProfile));
	state.servdCredentials = null;

	if (state.selectedHosting.value === 'servd') {
		state.servdCredentials = await promptServdCredentials();
	}
}

async function collectEmail(state) {
	state.postmarkToken = null;
	state.smtpCredentials = null;

	const hasPostmark = state.selectedTp.some((pl) => pl.handle === 'postmark');
	const requiresProductionMail = ['servd', 'craft-cloud'].includes(state.selectedHosting.value);

	if (hasPostmark) {
		state.postmarkToken = await promptPostmarkToken({ required: requiresProductionMail });
	} else if (requiresProductionMail) {
		const hostingEmail = await promptHostingEmail(state.selectedHosting.label);
		if (hostingEmail.type === 'postmark') {
			state.postmarkToken = hostingEmail.postmarkToken;
			if (!state.selectedTp.some((pl) => pl.handle === 'postmark')) {
				state.selectedTp.push(hostingEmail.postmarkPlugin);
			}
		} else if (hostingEmail.type === 'smtp') {
			state.smtpCredentials = hostingEmail.smtp;
		}
	}
}

async function main() {
	intro();

	// Bail out early with a clear message if Docker/DDEV/Node aren't ready
	checkPrerequisites();
	const previousManifest = readSetupManifest();
	const activeCraftProfile = resolveCraftProfile(previousManifest?.craft || DEFAULT_CRAFT_PROFILE);
	const activeCraftReleaseChannel = previousManifest?.craft?.channel || activeCraftProfile.release.defaultChannel;
	const chooseCraftPlatform = !previousManifest;

	// Detect existing project — .env is written on first run.
	// `make create` is scoped to first-run scaffolding only; re-runs would
	// clobber user edits to .env / composer.json / lock files. Route users
	// to the right tool based on intent.
	if (fs.existsSync(`${ROOT}/.env`)) {
		p.log.warn('A project already exists in this directory (.env found).');
		const isPending = previousManifest?.status === 'pending';
		const action = await p.select({
			message: 'What would you like to do?',
			options: [
				{
					value: 'install',
					label: (isPending ? 'Resume setup ' : 'Reinstall existing project ') + pc.dim('(make install)'),
					hint: 'preserves project definition and source',
				},
				{
					value: 'reset',
					label: 'Full reset and create again',
					hint: `wipe local DB + .env + generated Project Config; keep ${activeCraftProfile.label}`,
				},
				{ value: 'cancel', label: pc.red('Cancel') },
			],
		});
		if (p.isCancel(action) || action === 'cancel') cancel();

		if (action === 'install') {
			const { spawn } = await import('child_process');
			const child = spawn('make', ['install'], { stdio: 'inherit', cwd: ROOT });
			await new Promise((resolve) => child.on('exit', resolve));
			process.exit(child.exitCode ?? 0);
		}

		if (action === 'reset') {
			// Explicit confirm — list exactly what's destroyed so there's no surprise
			p.log.warn(
				'This will permanently:\n' +
					'  • delete the DDEV project + database\n' +
					'  • delete .env (admin credentials, site URLs, all custom values)\n' +
					`  • delete ${activeCraftProfile.paths.projectConfig}/ (Craft project config)\n` +
					'  • delete incomplete temporary recovery files\n' +
					'Kept: all project source, translations, lockfiles, and the non-secret setup manifest',
			);
			const confirmed = await p.confirm({
				message: 'Proceed with reset?',
				initialValue: false,
			});
			if (p.isCancel(confirmed) || !confirmed) cancel('Cancelled.');

			const s = p.spinner();
			s.start('Resetting project');
			resetProject({ craftProfile: activeCraftProfile });
			s.stop('Reset complete');

			p.log.info('Starting fresh scaffold...');
			// Fall through to the normal create flow below
		}
	}

	const craftPlatform = chooseCraftPlatform
		? await promptCraftPlatform({
				initialProfile: activeCraftProfile,
				initialChannel: activeCraftReleaseChannel,
			})
		: { profile: activeCraftProfile, channel: activeCraftReleaseChannel };
	if (craftPlatform.profile.scaffold) {
		checkPrerequisites({ requireComposer: true });
	}

	const state = {
		craftProfile: craftPlatform.profile,
		craftReleaseChannel: craftPlatform.channel,
	};

	// -- Initial collection --------------------------------------------------
	await collectProject(state);
	await collectSitesAndFeatures(state);
	await collectPlugins(state);
	await collectPluginConfig(state);
	await collectHosting(state);
	await collectEmail(state);

	// -- Review loop ---------------------------------------------------------
	while (true) {
		for (const notice of applyCraftCloudDefaults(state)) {
			p.log.info(notice);
		}
		showConfigurationSummary(state);

		const action = await p.select({
			message: 'Ready to install?',
			options: [
				{ value: 'install', label: pc.green('Install with these settings') },
				{ value: 'project', label: 'Edit project details', hint: 'name, timezone, PHP, database, admin, etc.' },
				{ value: 'features', label: 'Edit sites / Redis' },
				{ value: 'plugins', label: 'Edit plugin selection' },
				{ value: 'hosting', label: 'Edit hosting / email' },
				{ value: 'cancel', label: pc.red('Cancel') },
			],
			initialValue: 'install',
		});

		if (p.isCancel(action) || action === 'cancel') cancel();
		if (action === 'install') {
			const siteConflicts = getSiteUrlConflicts(state.sites, state.project.cpTrigger || 'cms');
			if (siteConflicts.length > 0) {
				p.log.error(
					`Resolve these site URL conflicts before installation:\n${siteConflicts.map((conflict) => `  • ${conflict}`).join('\n')}`,
				);
				continue;
			}
			const selectedPackages = new Set([...state.selectedLr, ...state.selectedTp].map((plugin) => plugin.value));
			const removedPlugins = (previousManifest?.plugins || []).filter(
				(plugin) => !selectedPackages.has(plugin.package),
			);
			if (removedPlugins.length > 0) {
				p.log.warn(
					'The following previously selected plugins will be removed from composer.json:\n' +
						removedPlugins
							.map((plugin) => `  • ${plugin.handle}${plugin.edition ? ` (${plugin.edition})` : ''}`)
							.join('\n'),
				);
				const removeConfirmed = await p.confirm({
					message: 'Explicitly remove these plugins from the regenerated project?',
					initialValue: false,
				});
				if (p.isCancel(removeConfirmed)) cancel();
				if (!removeConfirmed) {
					p.log.info('Plugin removal cancelled. Edit plugin selection and add them back to continue.');
					continue;
				}
			}
			break;
		}

		// Edit a single section then loop back to the summary
		if (action === 'project') await collectProject(state);
		if (action === 'features') await collectSitesAndFeatures(state);
		if (action === 'plugins') {
			await collectPlugins(state);
			await collectPluginConfig(state);
			await collectHosting(state);
			await collectEmail(state);
		}
		if (action === 'hosting') {
			await collectHosting(state);
			await collectEmail(state);
		}
	}

	const {
		project,
		sites,
		database,
		useRedisCache,
		useRedisSession,
		useCritical,
		commitBuildFiles,
		selectedLr,
		selectedTp,
		selectedHosting,
		servdCredentials,
		postmarkToken,
		smtpCredentials,
		translationCategory,
		craftProfile,
		craftReleaseChannel,
	} = state;

	// -- Apply file changes --------------------------------------------------
	const s = p.spinner();

	// Persist all non-secret choices before mutating or installing anything so
	// an interrupted run can be resumed with the exact plugin editions.
	writeSetupManifest(buildSetupManifest(state, { status: 'pending' }));

	if (craftProfile.scaffold) {
		s.start(`Materializing ${craftProfile.label} application scaffold`);
		applyPlatformScaffold({ craftProfile });
		s.stop(`${craftProfile.label} application scaffold ready`);
	}

	s.start('Updating composer.json');
	updateComposer({
		selectedLr,
		selectedTp,
		selectedHosting,
		useRedisCache,
		craftProfile,
		craftReleaseChannel,
	});
	s.stop('composer.json updated');

	s.start('Updating package.json');
	const hasIconManager = [...selectedLr, ...selectedTp].some((pl) => pl.handle === 'icon-manager');
	updatePackageJson(project, { useCritical, hasIconManager, craftProfile });
	s.stop('package.json updated');

	// Clear any stale DDEV registration BEFORE updating config.yaml — `ddev delete`
	// reads the project name from the current config, so it must run while the old
	// name is still in place. Handles the case where the user ran `ddev start`
	// (as `craft-starter`) before `make create` (which changes the name).
	try {
		const { execSync } = await import('child_process');
		execSync('ddev delete -Oy', { cwd: ROOT, stdio: 'ignore' });
	} catch {
		/* no project to delete — fresh install */
	}

	s.start('Updating DDEV config');
	const preservedDdevSidecar = updateDdevConfig(project, { useCritical, database, craftProfile });
	s.stop('DDEV config updated');
	if (preservedDdevSidecar)
		p.log.warn(`Preserved customized ${preservedDdevSidecar}; remove it manually to fully disable Chromium wiring.`);

	if (project.phpVersion) {
		s.start(`Pinning PHP ${project.phpVersion}`);
		setPhpVersion(project.phpVersion, { craftProfile });
		s.stop(`PHP ${project.phpVersion} pinned in .ddev/config.yaml + composer.json`);
	}

	s.start('Applying critical-CSS choice');
	const preservedCriticalPartial = craftProfile.features.criticalCss
		? applyCriticalCssChoice(useCritical, { craftProfile })
		: null;
	s.stop('Critical-CSS choice applied');
	if (preservedCriticalPartial)
		p.log.warn(`Preserved customized ${preservedCriticalPartial}; review it against the new critical-CSS choice.`);

	s.start('Updating .gitignore');
	updateGitignore({ commitBuildFiles, craftProfile });
	s.stop('.gitignore updated');
	p.log.info(
		'composer.lock + package-lock.json will be committed — required for reproducible deploys (Craft Cloud, Servd, CI).',
	);

	s.start('Generating .env');
	generateEnvFile({
		project,
		sites,
		servdCredentials,
		postmarkToken,
		smtpCredentials,
		useRedisCache,
		useRedisSession,
		useCritical,
		selectedLr,
		selectedTp,
		selectedHosting,
		translationCategory,
		database,
		craftProfile,
	});
	s.stop('.env generated');

	s.start('Reconciling hosting and Redis files');
	const preservedCloudConfig = reconcileCraftCloudConfig({
		enabled: selectedHosting.value === 'craft-cloud',
		phpVersion: project.phpVersion,
	});
	if (!useRedisCache) removeRedisAddonFiles();
	s.stop('Hosting and Redis files reconciled');
	if (preservedCloudConfig) {
		p.log.warn(
			selectedHosting.value === 'craft-cloud'
				? `Preserved customized ${preservedCloudConfig}; verify its PHP/build settings manually.`
				: `Preserved customized ${preservedCloudConfig}; remove it manually if Craft Cloud is no longer used.`,
		);
	}

	s.start('Writing plugin configs');
	const allSelected = [...selectedLr, ...selectedTp];
	writePluginConfigs(allSelected, { craftProfile });
	const preservedPluginConfigs = cleanUnusedPluginConfigs([...LR_PLUGINS, ...THIRD_PARTY_PLUGINS], allSelected, {
		craftProfile,
	});
	const preservedBaseConfig = syncLrBaseConfig(selectedLr.length > 0, { craftProfile });
	s.stop('Plugin configs written');
	for (const config of [...preservedPluginConfigs, preservedBaseConfig].filter(Boolean)) {
		p.log.warn(`Preserved customized ${config}; it is no longer selected.`);
	}

	s.start('Scaffolding translations');
	const category = translationCategory || 'site';
	scaffoldTranslations(sites, category, { craftProfile });
	const preservedTranslations = cleanUnusedTranslations(sites, {
		previousSites: previousManifest?.sites || [],
		previousCategory: previousManifest?.translationCategory || 'site',
		category,
		craftProfile,
	});
	s.stop('Translations scaffolded');
	for (const translation of preservedTranslations) p.log.warn(`Preserved customized ${translation}.`);

	// Copy CP rebrand assets (login logo + site icon)
	if (craftProfile.features.rebrandAssets) syncRebrandAssets({ craftProfile, overwrite: true });

	// Write sites config for the PHP project config script to read
	const tmpDir = `${ROOT}/cli/tmp`;
	fs.mkdirSync(tmpDir, { recursive: true });
	fs.writeFileSync(`${tmpDir}/sites.json`, JSON.stringify(sites, null, 2));

	if (project.weekStartDay !== undefined) {
		// Always rewrite so re-running with a different choice (Sunday → Monday
		// or vice versa) flips correctly. Matches any digit argument.
		const generalPath = craftProjectPath(ROOT, 'generalConfig', craftProfile);
		let general = fs.readFileSync(generalPath, 'utf-8');
		general = general.replace(/->defaultWeekStartDay\(\d+\)/, `->defaultWeekStartDay(${project.weekStartDay})`);
		fs.writeFileSync(generalPath, general);
	}

	// -- Install pipeline ----------------------------------------------------
	const steps = buildInstallSteps({
		project,
		selectedLr,
		selectedTp,
		selectedHosting,
		useRedisCache,
		craftProfile,
	});
	for (const step of steps) {
		s.start(step.msg);
		try {
			let result;
			if (step.fn) {
				result = await step.fn();
			} else {
				await run(step.cmd);
			}
			if (result === 'skipped') {
				s.stop(pc.yellow('\u2192') + ' ' + step.msg + pc.dim(' (already done)'));
			} else {
				s.stop(pc.green('\u2713') + ' ' + step.msg);
			}
		} catch (err) {
			s.error(step.msg);
			p.log.error(err.message);
			p.cancel('Installation failed. Fix the error above and re-run: make create → Resume setup');
			process.exit(1);
		}
	}

	markSetupComplete();
	fs.rmSync(`${ROOT}/cli/tmp`, { recursive: true, force: true });

	const hasPlaceholders = Boolean(servdCredentials?.placeholder);
	outro({ project, useCritical, hasPlaceholders });
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
