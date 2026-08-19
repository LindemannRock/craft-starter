#!/usr/bin/env node

/**
 * Manage Redis after the initial project installation.
 *
 * Interactive entry points:
 *   make redis
 *   node cli/scripts/redis.mjs
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { ROOT } from '../paths.mjs';
import { cancel } from '../utils/cancel.mjs';
import { checkPrerequisites } from '../utils/preflight.mjs';
import { run } from '../utils/run.mjs';
import { readSetupManifest } from '../actions/setupManifest.mjs';
import {
	buildRedisEnableSteps,
	buildRedisRemoveSteps,
	deleteRedisEnvironment,
	getRedisState,
	writeRedisEnvironment,
} from '../actions/redis.mjs';

function stateLabel(state) {
	if (state.enabled) {
		return state.sessionsEnabled ? 'Redis cache + sessions' : 'Redis cache only';
	}
	if (state.disabled) return 'Disabled';

	const found = [];
	if (state.hasEnvironment) found.push('.env');
	if (state.packageInstalled) found.push('Composer package');
	if (state.addonInstalled) found.push('DDEV add-on');
	return `Incomplete (${found.join(' + ')})`;
}

async function runSteps(steps) {
	const spinner = p.spinner();
	for (const step of steps) {
		spinner.start(step.msg);
		try {
			await run(step.cmd);
			spinner.stop(step.msg);
		} catch (err) {
			spinner.error(step.msg);
			throw err;
		}
	}
}

async function enableOrRepair(state, craft) {
	const useSessions = await p.confirm({
		message: 'Use Redis for PHP sessions too?',
		initialValue: state.sessionsEnabled,
	});
	if (p.isCancel(useSessions)) cancel('Redis configuration cancelled.');

	await runSteps(buildRedisEnableSteps(state, { craftProfile: craft, craftReleaseChannel: craft?.channel }));
	writeRedisEnvironment({ useSessions });

	p.log.success(
		useSessions
			? 'Redis enabled for cache (DB 0) and sessions (DB 1).'
			: 'Redis enabled for cache (DB 0); sessions remain database-backed.',
	);
}

async function changeSessions(state) {
	const useSessions = !state.sessionsEnabled;
	const confirmed = await p.confirm({
		message: useSessions
			? 'Enable Redis sessions? Current control-panel sessions may be signed out.'
			: 'Disable Redis sessions? Current control-panel sessions may be signed out.',
		initialValue: false,
	});
	if (p.isCancel(confirmed) || !confirmed) cancel('Redis session change cancelled.');

	writeRedisEnvironment({ useSessions });
	p.log.success(
		useSessions
			? 'Redis sessions enabled on DB 1.'
			: 'Redis sessions disabled; Craft will use database-backed sessions.',
	);
}

async function removeRedis(state, craft) {
	p.log.warn(
		'This removes Redis environment values, yiisoft/yii2-redis, and the DDEV add-on.\n' +
			'Any custom plugin that connects to this Redis service must be reconfigured first.',
	);
	const confirmed = await p.confirm({
		message: 'Disable and fully remove Redis?',
		initialValue: false,
	});
	if (p.isCancel(confirmed) || !confirmed) cancel('Redis removal cancelled.');

	// Disable Craft first. If Composer or DDEV removal later fails, the project
	// safely falls back to file cache and database-backed sessions.
	deleteRedisEnvironment();
	await runSteps(buildRedisRemoveSteps(state, { craftProfile: craft, craftReleaseChannel: craft?.channel }));
	p.log.success('Redis removed; Craft now uses file cache and database-backed sessions.');
}

async function main() {
	p.intro(pc.bgCyan(pc.black(' Redis ')));

	if (!fs.existsSync(`${ROOT}/.env`)) {
		p.log.error('No .env file found. Run ' + pc.bold('make create') + ' first.');
		process.exit(0);
	}
	checkPrerequisites({ retryCommand: 'make redis' });

	const craft = readSetupManifest()?.craft;
	const state = getRedisState({ craftProfile: craft, craftReleaseChannel: craft?.channel });
	p.log.info(`Current state: ${pc.bold(stateLabel(state))}`);

	const options = [];
	if (!state.enabled) {
		options.push({
			value: 'enable',
			label: state.partial ? 'Finish enabling Redis' : 'Enable Redis',
			hint: 'cache with optional sessions',
		});
	} else {
		options.push({
			value: 'sessions',
			label: state.sessionsEnabled ? 'Disable Redis sessions' : 'Enable Redis sessions',
			hint: 'cache remains enabled',
		});
	}
	if (!state.disabled) {
		options.push({ value: 'remove', label: pc.red('Disable and remove Redis') });
	}
	options.push({ value: 'cancel', label: pc.dim('Cancel') });

	const action = await p.select({ message: 'What would you like to do?', options });
	if (p.isCancel(action) || action === 'cancel') cancel('Redis configuration cancelled.');

	try {
		if (action === 'enable') await enableOrRepair(state, craft);
		if (action === 'sessions') await changeSessions(state);
		if (action === 'remove') await removeRedis(state, craft);
	} catch (err) {
		p.log.error(err.message);
		p.outro(pc.red('Redis configuration stopped. Re-run this command to inspect and repair the remaining state.'));
		process.exit(1);
	}

	p.outro(pc.green('Redis configuration complete.'));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
