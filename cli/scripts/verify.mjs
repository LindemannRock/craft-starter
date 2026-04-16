#!/usr/bin/env node

/**
 * Scan .env for unfilled placeholders left by `make create` when the user
 * chose to scaffold without credentials. Prints a grouped list so they can
 * fill them in before deploying.
 *
 * Exits 0 (clean) or 1 (placeholders found) so this can gate deploys in CI.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import pc from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const ENV_PATH = path.join(ROOT, '.env');

function main() {
	p.intro(pc.bgCyan(pc.black(' Verify ')));

	if (!fs.existsSync(ENV_PATH)) {
		p.log.error('No .env file found. Run ' + pc.bold('make create') + ' first.');
		p.outro(pc.red('Failed'));
		process.exit(1);
	}

	const content = fs.readFileSync(ENV_PATH, 'utf-8');
	const lines = content.split('\n');

	const todos = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		// Match KEY=... where the value is a "# TODO:" comment or empty after TODO marker
		const match = line.match(/^([A-Z_]+)=(.*)$/);
		if (!match) continue;

		const [, key, value] = match;
		const trimmed = value.trim();

		if (/^#\s*TODO:/i.test(trimmed)) {
			todos.push({ line: i + 1, key, value: trimmed });
		}
	}

	if (todos.length === 0) {
		p.outro(pc.green('All env vars look filled in. Safe to deploy.'));
		process.exit(0);
	}

	const formatted = todos.map(({ line, key, value }) => {
		return `  ${pc.dim(`L${line}`)}  ${pc.bold(key)}\n         ${pc.yellow(value)}`;
	}).join('\n\n');

	p.log.warn(`Found ${todos.length} unfilled placeholder${todos.length === 1 ? '' : 's'} in .env:`);
	console.log('');
	console.log(formatted);
	console.log('');
	p.outro(pc.red('Fill these in before deploying.'));
	process.exit(1);
}

main();
