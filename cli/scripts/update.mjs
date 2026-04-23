#!/usr/bin/env node

/**
 * Interactive update picker — single entry point replacing the scattered
 * `make update-*` targets. Runs on the host (not inside DDEV) and shells out
 * to the right command per selection.
 *
 * For Craft itself we delegate to `craft update` (no args) so the user gets
 * Craft's native interactive flow with the real list of available updates —
 * no point reinventing it.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { spawn } from 'child_process';
import { cancel } from '../utils/cancel.mjs';
import { requireProject } from '../utils/preflight.mjs';

const TARGETS = [
	{ value: 'craft',    label: 'Craft CMS + plugins', hint: 'interactive — pick what to update' },
	{ value: 'composer', label: 'Composer packages',    hint: 'composer update' },
	{ value: 'npm',      label: 'Frontend packages',    hint: 'vite, tailwind, alpine, etc. (npm-check)' },
	{ value: 'cli',      label: 'CLI tooling',          hint: 'scaffolding packages in cli/ (npm-check)' },
	{ value: 'all',      label: 'Everything',           hint: 'Craft + plugins + Composer + Frontend + CLI' },
	{ value: 'cancel',   label: pc.red('Cancel') },
];

function runShell(command, args) {
	return new Promise((resolve) => {
		const child = spawn(command, args, { stdio: 'inherit' });
		child.on('exit', (code) => resolve(code ?? 0));
	});
}

async function runTarget(target, { interactive = true } = {}) {
	if (target === 'craft' && interactive) {
		// Delegate to Craft's native interactive update flow
		p.log.step('ddev exec php craft update');
		return runShell('ddev', ['exec', 'php', 'craft', 'update']);
	}
	p.log.step(`make update-${target}`);
	return runShell('make', [`update-${target}`]);
}

async function main() {
	p.intro(pc.bgCyan(pc.black(' Update ')));
	requireProject();

	const choice = await p.select({
		message: 'What would you like to update?',
		options: TARGETS,
	});
	if (p.isCancel(choice) || choice === 'cancel') cancel();

	const isAll = choice === 'all';
	const order = isAll ? ['craft', 'composer', 'npm', 'cli'] : [choice];
	let failed = false;
	for (const t of order) {
		const code = await runTarget(t, { interactive: !isAll });
		if (code !== 0) {
			failed = true;
			if (isAll) p.log.warn(`update-${t} failed — continuing with the rest`);
			else break;
		}
	}

	p.outro(failed ? pc.red('One or more updates failed — see output above.') : pc.green('Done.'));
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
