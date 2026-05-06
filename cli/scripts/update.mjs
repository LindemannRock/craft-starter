#!/usr/bin/env node

/**
 * Interactive update picker — single entry point replacing the scattered
 * `make update-*` targets. Runs on the host (not inside DDEV) and shells out
 * to the right command per selection.
 *
 * For Craft + plugins we run `craft update` to fetch the list, parse it, and
 * present a multiselect so the user can pick exactly which packages to apply.
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
	{ value: 'craft',    label: 'Craft CMS + plugins', hint: 'pick which packages to update' },
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

function captureShell(command, args) {
	return new Promise((resolve) => {
		const child = spawn(command, args, { stdio: ['inherit', 'pipe', 'inherit'] });
		let out = '';
		child.stdout.on('data', (d) => { out += d.toString(); });
		child.on('exit', (code) => resolve({ code: code ?? 0, stdout: out }));
	});
}

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B\[[0-?]*[ -/]*[@-~]/g;

function parseUpdates(output) {
	const clean = output.replace(ANSI_RE, '');
	const updates = [];
	// Lines look like:   "    - craft 5.9.20 => 5.9.22"
	const re = /^\s*-\s+(\S+)\s+(\S+)\s*=>\s*(\S+)\s*$/gm;
	let m;
	while ((m = re.exec(clean)) !== null) {
		updates.push({ handle: m[1], from: m[2], to: m[3] });
	}
	return updates;
}

async function runCraftInteractive() {
	p.log.step('Fetching available Craft + plugin updates…');
	const { code, stdout } = await captureShell('ddev', ['exec', 'php', 'craft', 'update']);
	process.stdout.write(stdout);
	if (code !== 0) {
		p.log.warn('Failed to fetch update list.');
		return code;
	}

	const updates = parseUpdates(stdout);
	if (updates.length === 0) {
		p.log.success('Nothing to update.');
		return 0;
	}

	const picks = await p.multiselect({
		message: 'Which packages do you want to update?',
		options: updates.map((u) => ({
			value: u.handle,
			label: u.handle,
			hint: `${u.from} → ${u.to}`,
		})),
		initialValues: updates.map((u) => u.handle),
		required: false,
	});
	if (p.isCancel(picks)) cancel();
	if (!picks || picks.length === 0) {
		p.log.info('No packages selected — skipping.');
		return 0;
	}

	// If everything is selected, a single `update all` is faster than N invocations.
	if (picks.length === updates.length) {
		p.log.step('ddev exec php craft update all');
		return runShell('ddev', ['exec', 'php', 'craft', 'update', 'all']);
	}

	let runCode = 0;
	for (const handle of picks) {
		p.log.step(`ddev exec php craft update ${handle}`);
		const c = await runShell('ddev', ['exec', 'php', 'craft', 'update', handle]);
		if (c !== 0) {
			p.log.warn(`Update for ${handle} failed — continuing.`);
			runCode = c;
		}
	}
	return runCode;
}

async function runTarget(target, { interactive = true } = {}) {
	if (target === 'craft') {
		if (interactive) return runCraftInteractive();
		// "Everything" path — apply all without prompting
		p.log.step('ddev exec php craft update all');
		return runShell('ddev', ['exec', 'php', 'craft', 'update', 'all']);
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
