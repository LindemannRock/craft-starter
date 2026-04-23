#!/usr/bin/env node

/**
 * Interactive database picker — single entry point for pull/export/import
 * operations. Shells out to `make db-<action>` with an optional file= arg.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { spawn } from 'child_process';
import { cancel } from '../utils/cancel.mjs';
import { requireProject } from '../utils/preflight.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// .gitignore rules: `*.sql.gz` is ignored (disposable dumps),
// `*.sql.gzip` is the intentional seed-DB exception.
const WORKING_FILE = 'db.sql.gz';
const SEED_FILE = 'db.sql.gzip';

function hasServd() {
	try {
		const composer = JSON.parse(fs.readFileSync(path.join(ROOT, 'composer.json'), 'utf-8'));
		return Boolean(composer.require?.['servd/asset-storage'] || composer['require-dev']?.['servd/asset-storage']);
	} catch {
		return false;
	}
}

function buildActions() {
	const actions = [];
	if (hasServd()) {
		actions.push({ value: 'pull', label: 'Pull from Servd', hint: 'overwrites local DB (Servd hosting only)' });
	}
	actions.push(
		{ value: 'export', label: 'Export local database',  hint: 'working dump or seed DB' },
		{ value: 'import', label: 'Import a SQL dump',      hint: `default: ./${WORKING_FILE}` },
		{ value: 'cancel', label: pc.red('Cancel') },
	);
	return actions;
}

function runShell(command, args) {
	return new Promise((resolve) => {
		const child = spawn(command, args, { stdio: 'inherit' });
		child.on('exit', (code) => resolve(code ?? 0));
	});
}

// Keep export/import paths inside the project so the user can't accidentally
// (or maliciously) write dumps outside the working tree via `../` traversal.
function validatePath(v) {
	if (!v) return;
	if (v.startsWith('/')) return 'Absolute paths not allowed — use a path relative to the project root';
	if (v.includes('..')) return 'Paths with `..` not allowed — must stay within the project';
	if (/[\r\n\0]/.test(v)) return 'No control characters';
}

async function pickExportFile() {
	const kind = await p.select({
		message: 'What kind of export?',
		options: [
			{ value: 'working', label: 'Working dump', hint: `${WORKING_FILE} — git-ignored` },
			{ value: 'seed',    label: 'Seed DB',      hint: `${SEED_FILE} — committed to git` },
		],
	});
	if (p.isCancel(kind)) cancel();
	const defaultName = kind === 'seed' ? SEED_FILE : WORKING_FILE;

	const file = await p.text({
		message: 'Output file path',
		placeholder: defaultName,
		defaultValue: defaultName,
		validate: validatePath,
	});
	if (p.isCancel(file)) cancel();
	return file || defaultName;
}

async function pickImportFile() {
	const file = await p.text({
		message: 'Input file path',
		placeholder: WORKING_FILE,
		defaultValue: WORKING_FILE,
		validate: validatePath,
	});
	if (p.isCancel(file)) cancel();
	return file || WORKING_FILE;
}

async function main() {
	p.intro(pc.bgCyan(pc.black(' Database ')));
	requireProject();

	const action = await p.select({
		message: 'What would you like to do?',
		options: buildActions(),
	});
	if (p.isCancel(action) || action === 'cancel') cancel();

	const args = [`db-${action}`];

	if (action === 'export') {
		const file = await pickExportFile();
		args.push(`file=${file}`);
	} else if (action === 'import') {
		const file = await pickImportFile();
		if (!fs.existsSync(file)) {
			p.log.error(`File not found: ${file}`);
			process.exit(1);
		}
		args.push(`file=${file}`);
	}

	if (action === 'pull') {
		const confirm = await p.confirm({
			message: 'This will overwrite your local database. Continue?',
			initialValue: false,
		});
		if (p.isCancel(confirm) || !confirm) cancel('Cancelled.');
	}

	p.log.step(`make ${args.join(' ')}`);
	const code = await runShell('make', args);
	if (code !== 0) {
		p.outro(pc.red('Command failed — see output above.'));
		process.exit(0);
	}
	p.outro(pc.green('Done.'));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
