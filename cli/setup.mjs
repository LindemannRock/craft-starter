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
import { LR_PLUGINS, THIRD_PARTY_PLUGINS } from './config/plugins.mjs';
import { promptProject } from './prompts/project.mjs';
import {
	promptLrPlugins,
	promptThirdPartyPlugins,
	promptHosting,
} from './prompts/plugins.mjs';
import { promptSites } from './prompts/sites.mjs';
import { promptServdCredentials } from './prompts/servd.mjs';
import { promptServdEmail } from './prompts/servd-email.mjs';
import { promptPostmarkToken } from './prompts/postmark.mjs';
import { promptTranslationCategory } from './prompts/translation-manager.mjs';
import { promptRedis } from './prompts/redis.mjs';
import { promptCritical } from './prompts/critical.mjs';
import { updateComposer } from './actions/composer.mjs';
import { updatePackageJson } from './actions/packageJson.mjs';
import { updateDdevConfig } from './actions/ddev.mjs';
import { applyCriticalCssChoice } from './actions/critical.mjs';
import { stripStarterOnlyIgnores } from './actions/gitignore.mjs';
import { generateEnvFile } from './actions/env.mjs';
import { writePluginConfigs, cleanUnusedPluginConfigs } from './actions/plugins.mjs';
import { scaffoldTranslations, cleanUnusedTranslations } from './actions/sites.mjs';
import { buildInstallSteps } from './actions/install.mjs';
import { intro, showConfigurationSummary, outro } from './ui.mjs';
import fs from 'fs';
import { cancel } from './utils/cancel.mjs';
import { run } from './utils/run.mjs';
import { checkPrerequisites } from './utils/preflight.mjs';
import { ROOT } from './paths.mjs';

// Phase collectors — each one updates `state` in place. Extracted so the review
// loop can re-run a single section without re-asking everything else.

async function collectProject(state) {
	state.project = await promptProject();
}

async function collectSitesAndFeatures(state) {
	state.sites = await promptSites(state.project?.description || state.project?.name);
	state.useRedis = await promptRedis();
	state.useCritical = await promptCritical();
}

async function collectPlugins(state) {
	state.selectedLr = await promptLrPlugins();
	state.selectedTp = await promptThirdPartyPlugins();

	// Auto-add dependencies for selected plugins
	const hasFormieAddon = state.selectedLr.some((pl) => pl.handle.startsWith('formie-'));
	const hasFormie = state.selectedTp.some((pl) => pl.handle === 'formie');
	if (hasFormieAddon && !hasFormie) {
		const formiePlugin = THIRD_PARTY_PLUGINS.find((pl) => pl.handle === 'formie');
		if (formiePlugin) {
			state.selectedTp.push({ ...formiePlugin, autoAdded: 'Formie addon(s)' });
			p.log.info('Formie auto-added — required by selected Formie addon(s)');
		}
	}

	const hasFormieSms = state.selectedLr.some((pl) => pl.handle === 'formie-sms');
	const hasSmsManager = state.selectedLr.some((pl) => pl.handle === 'sms-manager');
	if (hasFormieSms && !hasSmsManager) {
		const smsPlugin = LR_PLUGINS.find((pl) => pl.handle === 'sms-manager');
		if (smsPlugin) {
			state.selectedLr.push({ ...smsPlugin, autoAdded: 'Formie SMS' });
			p.log.info('SMS Manager auto-added — required by Formie SMS');
		}
	}
}

async function collectPluginConfig(state) {
	state.translationCategory = null;

	const hasTranslationManager = [...state.selectedLr, ...state.selectedTp].some((pl) => pl.handle === 'translation-manager');
	if (hasTranslationManager) {
		state.translationCategory = await promptTranslationCategory();
	}
}

async function collectHosting(state) {
	state.selectedHosting = await promptHosting();
	state.servdCredentials = null;

	if (state.selectedHosting.value === 'servd') {
		state.servdCredentials = await promptServdCredentials();
	}
}

async function collectEmail(state) {
	state.postmarkToken = null;
	state.smtpCredentials = null;

	const hasPostmark = state.selectedTp.some((pl) => pl.handle === 'postmark');

	if (hasPostmark) {
		state.postmarkToken = await promptPostmarkToken();
	} else if (state.selectedHosting.value === 'servd') {
		const servdEmail = await promptServdEmail();
		if (servdEmail.type === 'postmark') {
			state.postmarkToken = servdEmail.postmarkToken;
			if (!state.selectedTp.some((pl) => pl.handle === 'postmark')) {
				state.selectedTp.push(servdEmail.postmarkPlugin);
			}
		} else if (servdEmail.type === 'smtp') {
			state.smtpCredentials = servdEmail.smtp;
		}
	}
}

async function main() {
	intro();

	// Bail out early with a clear message if Docker/DDEV/Node aren't ready
	checkPrerequisites();

	// Detect existing project — .env is written on first run.
	// `make create` is scoped to first-run scaffolding only; re-runs would
	// clobber user edits to .env / composer.json / lock files. Route users
	// to the right tool based on intent.
	if (fs.existsSync(`${ROOT}/.env`)) {
		p.log.warn('A project already exists in this directory (.env found).');
		const action = await p.select({
			message: 'What would you like to do?',
			options: [
				{ value: 'install', label: 'Resync ' + pc.dim('(make install)'),      hint: 'idempotent — preserves .env / composer.json / lock files' },
				{ value: 'reset',   label: 'Start over ' + pc.dim('(make reset)'),    hint: 'wipe DB + .env + config/project, keep vendor/node_modules' },
				{ value: 'cancel',  label: pc.red('Cancel') },
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
			p.log.warn('This will permanently:\n' +
				'  • delete the DDEV project + database\n' +
				'  • delete .env (admin credentials, site URLs, all custom values)\n' +
				'  • delete config/project/ (Craft project config)\n' +
				'  • delete craft-cloud.yaml (if present)\n' +
				'Kept: vendor/, node_modules/, composer.lock, package-lock.json');
			const confirmed = await p.confirm({
				message: 'Proceed with reset?',
				initialValue: false,
			});
			if (p.isCancel(confirmed) || !confirmed) cancel('Cancelled.');

			const { execSync } = await import('child_process');
			const s = p.spinner();
			s.start('Resetting project');
			try { execSync('ddev delete -Oy', { cwd: ROOT, stdio: 'ignore' }); } catch { /* DDEV may not be running */ }
			fs.rmSync(`${ROOT}/.env`, { force: true });
			fs.rmSync(`${ROOT}/config/project`, { recursive: true, force: true });
			fs.rmSync(`${ROOT}/craft-cloud.yaml`, { force: true });
			s.stop('Reset complete');

			p.log.info('Starting fresh scaffold...');
			// Fall through to the normal create flow below
		}
	}

	const state = {};

	// -- Initial collection --------------------------------------------------
	await collectProject(state);
	await collectSitesAndFeatures(state);
	await collectPlugins(state);
	await collectPluginConfig(state);
	await collectHosting(state);
	await collectEmail(state);

	// -- Review loop ---------------------------------------------------------
	while (true) {
		showConfigurationSummary(state);

		const action = await p.select({
			message: 'Ready to install?',
			options: [
				{ value: 'install', label: pc.green('Install with these settings') },
				{ value: 'project', label: 'Edit project details', hint: 'name, timezone, admin, etc.' },
				{ value: 'features', label: 'Edit sites / Redis' },
				{ value: 'plugins', label: 'Edit plugin selection' },
				{ value: 'hosting', label: 'Edit hosting / email' },
				{ value: 'cancel', label: pc.red('Cancel') },
			],
			initialValue: 'install',
		});

		if (p.isCancel(action) || action === 'cancel') cancel();
		if (action === 'install') break;

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

	const { project, sites, useRedis, useCritical, selectedLr, selectedTp, selectedHosting,
		servdCredentials, postmarkToken, smtpCredentials, translationCategory } = state;

	// -- Apply file changes --------------------------------------------------
	const s = p.spinner();

	s.start('Updating composer.json');
	updateComposer({ selectedLr, selectedTp, selectedHosting, useRedis });
	s.stop('composer.json updated');

	s.start('Updating package.json');
	updatePackageJson(project, { useCritical });
	s.stop('package.json updated');

	s.start('Updating DDEV config');
	updateDdevConfig(project, { useCritical });
	s.stop('DDEV config updated');

	s.start('Applying critical-CSS choice');
	applyCriticalCssChoice(useCritical);
	s.stop('Critical-CSS choice applied');

	s.start('Updating .gitignore');
	stripStarterOnlyIgnores();
	s.stop('.gitignore updated — lock files now trackable');
	p.log.info('composer.lock + package-lock.json will be committed — required for reproducible deploys (Craft Cloud, Servd, CI).');

	s.start('Generating .env');
	generateEnvFile({ project, sites, servdCredentials, postmarkToken, smtpCredentials, useRedis, useCritical, selectedLr, selectedTp, selectedHosting });
	s.stop('.env generated');

	if (selectedHosting.value === 'craft-cloud') {
		s.start('Generating craft-cloud.yaml');
		fs.writeFileSync(`${ROOT}/craft-cloud.yaml`, [
			'php-version: \'8.3\'',
			'node-version: \'22\'',
			'npm-script: build',
			'',
		].join('\n'));
		s.stop('craft-cloud.yaml generated');
	}

	s.start('Writing plugin configs');
	const allSelected = [...selectedLr, ...selectedTp];
	writePluginConfigs(allSelected);
	cleanUnusedPluginConfigs([...LR_PLUGINS, ...THIRD_PARTY_PLUGINS], allSelected);

	// Always include lindemannrock-base config when any LR plugin is selected
	if (selectedLr.length > 0) {
		const baseSrc = `${ROOT}/cli/templates/plugins/lindemannrock-base.php`;
		const baseDest = `${ROOT}/config/lindemannrock-base.php`;
		if (fs.existsSync(baseSrc) && !fs.existsSync(baseDest)) {
			fs.copyFileSync(baseSrc, baseDest);
		}
	}

	// Patch Translation Manager config with prompted category + primary site language
	if (translationCategory) {
		const tmConfig = `${ROOT}/config/translation-manager.php`;
		if (fs.existsSync(tmConfig)) {
			let content = fs.readFileSync(tmConfig, 'utf-8');
			content = content.replace(
				"'translationCategory' => 'messages'",
				`'translationCategory' => '${translationCategory}'`,
			);
			const primaryLang = sites[0]?.language?.split('-')[0] || 'en';
			content = content.replace(
				"'sourceLanguage' => 'en'",
				`'sourceLanguage' => '${primaryLang}'`,
			);
			fs.writeFileSync(tmConfig, content);
		}

		// Patch global-variables.twig to use the prompted category
		if (translationCategory !== 'site') {
			const globalVars = `${ROOT}/templates/_layouts/global-variables.twig`;
			if (fs.existsSync(globalVars)) {
				let content = fs.readFileSync(globalVars, 'utf-8');
				content = content.replace(
					"{% set primaryTranslationCategory = 'site' %}",
					`{% set primaryTranslationCategory = '${translationCategory}' %}`,
				);
				fs.writeFileSync(globalVars, content);
			}
		}
	}
	s.stop('Plugin configs written');

	s.start('Scaffolding translations');
	scaffoldTranslations(sites, translationCategory || 'site');
	cleanUnusedTranslations(sites);
	s.stop('Translations scaffolded');

	// Copy CP rebrand assets (login logo + site icon)
	const rebrandSrc = `${ROOT}/cli/templates/rebrand`;
	const rebrandDest = `${ROOT}/storage/rebrand`;
	if (fs.existsSync(rebrandSrc)) {
		fs.cpSync(rebrandSrc, rebrandDest, { recursive: true });
	}

	// Write sites config for the PHP project config script to read
	const tmpDir = `${ROOT}/cli/tmp`;
	fs.mkdirSync(tmpDir, { recursive: true });
	fs.writeFileSync(`${tmpDir}/sites.json`, JSON.stringify(sites, null, 2));

	if (project.weekStartDay !== undefined) {
		// Always rewrite so re-running with a different choice (Sunday → Monday
		// or vice versa) flips correctly. Matches any digit argument.
		const generalPath = `${ROOT}/config/general.php`;
		let general = fs.readFileSync(generalPath, 'utf-8');
		general = general.replace(
			/->defaultWeekStartDay\(\d+\)/,
			`->defaultWeekStartDay(${project.weekStartDay})`,
		);
		fs.writeFileSync(generalPath, general);
	}

	// -- Install pipeline ----------------------------------------------------
	const steps = buildInstallSteps({
		project,
		selectedLr,
		selectedTp,
		selectedHosting,
		useRedis,
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
			p.cancel('Installation failed. Fix the error above and re-run: make install');
			process.exit(1);
		}
	}

	const hasPlaceholders = Boolean(servdCredentials?.placeholder);
	outro({ project, useCritical, hasPlaceholders });
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
