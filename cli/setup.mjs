#!/usr/bin/env node

/**
 * LindemannRock Craft CMS Starter — Interactive Setup (orchestrator)
 *
 * Walks the user through the setup prompts, applies configuration changes,
 * and runs the install pipeline (DDEV + Composer + NPM + Craft).
 *
 * All logic lives in ./prompts, ./actions, ./config, and ./utils — this file
 * just wires them together in order.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { LR_PLUGINS, THIRD_PARTY_PLUGINS } from './config/plugins.mjs';
import { promptProject } from './prompts/project.mjs';
import {
	promptBilingual,
	promptLrPlugins,
	promptThirdPartyPlugins,
	promptHosting,
} from './prompts/plugins.mjs';
import { promptServdCredentials } from './prompts/servd.mjs';
import { promptServdEmail } from './prompts/servd-email.mjs';
import { promptPostmarkToken } from './prompts/postmark.mjs';
import { promptRedis } from './prompts/redis.mjs';
import { updateComposer } from './actions/composer.mjs';
import { updatePackageJson } from './actions/packageJson.mjs';
import { updateDdevConfig } from './actions/ddev.mjs';
import { generateEnvFile } from './actions/env.mjs';
import { writePluginConfigs, cleanUnusedPluginConfigs } from './actions/plugins.mjs';
import { removeBilingual } from './actions/bilingual.mjs';
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

async function collectFeatures(state) {
	state.bilingual = await promptBilingual();
	state.useRedis = await promptRedis();
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

async function collectHosting(state) {
	state.selectedHosting = await promptHosting();

	state.servdCredentials = null;
	state.postmarkToken = null;
	state.smtpCredentials = null;

	if (state.selectedHosting.value === 'servd') {
		state.servdCredentials = await promptServdCredentials();
	}

	const hasPostmark = state.selectedTp.some((pl) => pl.handle === 'postmark');

	if (hasPostmark) {
		state.postmarkToken = await promptPostmarkToken();
	} else if (state.selectedHosting.value === 'servd') {
		const servdEmail = await promptServdEmail();
		if (servdEmail.type === 'postmark') {
			state.postmarkToken = servdEmail.postmarkToken;
			// Auto-add the Postmark plugin to the selection (avoid duplicates)
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

	// Detect existing project — .env is written on first run
	if (fs.existsSync(`${ROOT}/.env`)) {
		p.log.warn('A project already exists in this directory (.env found).');
		const action = await p.select({
			message: 'What would you like to do?',
			options: [
				{ value: 'continue', label: 'Continue anyway', hint: 'overwrite config files, skip Craft install if already set up' },
				{ value: 'reset', label: 'Start fresh', hint: 'same as make reset — wipes DB + .env, then re-runs setup' },
				{ value: 'cancel', label: 'Cancel' },
			],
		});
		if (p.isCancel(action) || action === 'cancel') cancel();
		if (action === 'reset') {
			p.log.info('Run ' + pc.bold('make reset') + ' to wipe and start over.');
			process.exit(0);
		}
		// action === 'continue' — fall through to prompts
	}

	const state = {};

	// -- Initial collection --------------------------------------------------
	await collectProject(state);
	await collectFeatures(state);
	await collectPlugins(state);
	await collectHosting(state);

	// -- Review loop ---------------------------------------------------------
	while (true) {
		showConfigurationSummary(state);

		const action = await p.select({
			message: 'Ready to install?',
			options: [
				{ value: 'install', label: pc.green('Install with these settings') },
				{ value: 'project', label: 'Edit project details', hint: 'name, timezone, admin, etc.' },
				{ value: 'features', label: 'Edit bilingual / Redis' },
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
		if (action === 'features') await collectFeatures(state);
		if (action === 'plugins') {
			await collectPlugins(state);
			// Plugin changes can affect hosting/email logic — re-run hosting too
			await collectHosting(state);
		}
		if (action === 'hosting') await collectHosting(state);
	}

	const { project, bilingual, useRedis, selectedLr, selectedTp, selectedHosting,
		servdCredentials, postmarkToken, smtpCredentials } = state;

	// -- Apply file changes --------------------------------------------------
	const s = p.spinner();

	s.start('Updating composer.json');
	updateComposer({ selectedLr, selectedTp, selectedHosting, useRedis });
	s.stop('composer.json updated');

	s.start('Updating package.json');
	updatePackageJson(project);
	s.stop('package.json updated');

	s.start('Updating DDEV config');
	updateDdevConfig(project);
	s.stop('DDEV config updated');

	s.start('Generating .env');
	generateEnvFile({ project, bilingual, servdCredentials, postmarkToken, smtpCredentials, useRedis, selectedLr, selectedTp, selectedHosting });
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
	s.stop('Plugin configs written');

	if (!bilingual) {
		s.start('Configuring single-language');
		removeBilingual();
		s.stop('Single-language configured');
	}

	if (project.weekStartDay !== undefined && project.weekStartDay !== 1) {
		const generalPath = `${ROOT}/config/general.php`;
		let general = fs.readFileSync(generalPath, 'utf-8');
		general = general.replace('->defaultWeekStartDay(1)', `->defaultWeekStartDay(${project.weekStartDay})`);
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
			s.stop(pc.red('\u2717') + ' ' + step.msg);
			p.log.error(err.message);
			p.cancel('Installation failed. Fix the error above and re-run: make install');
			process.exit(1);
		}
	}

	outro({ project });
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
