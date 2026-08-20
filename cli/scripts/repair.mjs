#!/usr/bin/env node

/** Interactive repair picker for recoverable local-development problems. */

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {spawn} from 'child_process';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {nukeRuntime} from '../actions/lifecycle.mjs';
import {readSetupManifest} from '../actions/setupManifest.mjs';
import {ROOT} from '../paths.mjs';
import {cancel} from '../utils/cancel.mjs';

export const REPAIR_ACTIONS = Object.freeze([
	{
		value: 'dependencies',
		label: 'Reinstall dependencies',
		hint: 'delete vendor + node_modules, clear caches, reinstall from lockfiles',
	},
	{value: 'logs', label: 'Clear logs', hint: 'delete local Craft log files'},
	{value: 'vite', label: 'Stop stuck Vite process', hint: 'kill the Vite process inside DDEV'},
	{
		value: 'runtime',
		label: 'Rebuild local runtime',
		hint: 'recreate DDEV/database, dependencies, build output, and runtime caches',
	},
]);

const MAKE_TARGETS = Object.freeze({
	dependencies: 'repair-dependencies',
	logs: 'repair-logs',
	vite: 'repair-vite',
});

function runShell(command, args) {
	return new Promise((resolve) => {
		const child = spawn(command, args, {cwd: ROOT, stdio: 'inherit'});
		child.on('error', () => resolve(1));
		child.on('exit', (code) => resolve(code ?? 1));
	});
}

export async function executeRepair(action, {run = runShell, nuke = nukeRuntime, craftProfile} = {}) {
	if (action === 'runtime') {
		nuke({craftProfile});
		return run('make', ['install']);
	}

	const target = MAKE_TARGETS[action];
	if (!target) throw new Error(`Unknown repair action: ${action}`);
	return run('make', [target]);
}

async function main() {
	p.intro(pc.bgYellow(pc.black(' Repair ')));

	if (!fs.existsSync(path.join(ROOT, '.env'))) {
		p.outro(pc.red('No .env file found. Run `make create` first.'));
		process.exit(1);
	}

	const action = await p.select({
		message: 'What would you like to repair?',
		options: [...REPAIR_ACTIONS, {value: 'cancel', label: pc.red('Cancel')}],
	});
	if (p.isCancel(action) || action === 'cancel') cancel();

	if (action === 'runtime') {
		const confirmed = await p.confirm({
			message:
				'Rebuild the local runtime? This deletes the DDEV database, dependencies, build output, and runtime caches. Project source, .env, Project Config, and lockfiles are preserved.',
			initialValue: false,
		});
		if (p.isCancel(confirmed) || !confirmed) cancel('Cancelled.');
	}

	const craftProfile = readSetupManifest()?.craft;
	const code = await executeRepair(action, {craftProfile});
	if (code !== 0) {
		p.outro(pc.red('Repair failed — see output above.'));
		process.exit(1);
	}

	p.outro(pc.green('Repair complete.'));
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
