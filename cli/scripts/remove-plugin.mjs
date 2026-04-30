#!/usr/bin/env node

/**
 * Interactively remove a plugin from the registry.
 *
 * - Removes the plugin entry from `cli/config/plugins.mjs` (LR_PLUGINS or
 *   THIRD_PARTY_PLUGINS).
 * - Offers to delete the matching `cli/templates/plugins/{handle}.php` config
 *   template if one exists.
 * - Does NOT touch `cli/templates/env.example` — env section names don't
 *   always match plugin handles, and `make create` re-derives sections from
 *   the registry anyway.
 *
 * Usage: make registry → Remove a plugin
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { LR_PLUGINS, THIRD_PARTY_PLUGINS } from '../config/plugins.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGINS_FILE = path.join(__dirname, '../config/plugins.mjs');
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'plugins');

p.intro(pc.bgCyan(pc.black(' Remove Plugin from Registry ')));

const all = [
	...LR_PLUGINS.map((pl) => ({ ...pl, list: 'lr', listLabel: 'LR' })),
	...THIRD_PARTY_PLUGINS.map((pl) => ({ ...pl, list: 'tp', listLabel: 'Third-party' })),
];

if (all.length === 0) {
	p.outro(pc.yellow('Registry is empty — nothing to remove.'));
	process.exit(0);
}

const choice = await p.select({
	message: 'Which plugin do you want to remove?',
	options: [
		...all.map((pl) => ({
			value: pl.value,
			label: `${pl.label}  ${pc.dim(`(${pl.listLabel})`)}`,
			hint: pl.value,
		})),
		{ value: '__cancel__', label: pc.red('Cancel') },
	],
});

if (p.isCancel(choice) || choice === '__cancel__') {
	p.outro('Cancelled.');
	process.exit(0);
}

const target = all.find((pl) => pl.value === choice);

p.note(
	[
		`${pc.bold('Package')}  ${target.value}`,
		`${pc.bold('Handle')}   ${target.handle}`,
		`${pc.bold('Label')}    ${target.label}`,
		`${pc.bold('List')}     ${target.listLabel}`,
		target.config ? `${pc.bold('Config')}   cli/templates/plugins/${target.config}` : '',
	].filter(Boolean).join('\n'),
	'Remove this plugin?',
);

const confirm = await p.confirm({
	message: 'Proceed?',
	initialValue: false,
});
if (p.isCancel(confirm) || !confirm) {
	p.outro('Cancelled.');
	process.exit(0);
}

// Remove the entry from plugins.mjs.
// Match the full `{ ... }` block whose `value: '{package}'` line we can find,
// plus the trailing comma + newline. Function replacer keeps `$` chars in
// label/hint from being interpreted as replacement patterns.
let content = fs.readFileSync(PLUGINS_FILE, 'utf-8');
const escaped = target.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blockRegex = new RegExp(
	`\\n\\t\\{\\s*\\n` +
	`(?:\\t\\t[^\\n]*\\n)*?` +
	`\\t\\tvalue:\\s*['"]${escaped}['"],[^\\n]*\\n` +
	`(?:\\t\\t[^\\n]*\\n)*?` +
	`\\t\\},?`,
);

if (!blockRegex.test(content)) {
	p.outro(pc.red(`Could not locate "${target.value}" in plugins.mjs — registry may be malformed.`));
	process.exit(1);
}

content = content.replace(blockRegex, () => '');
fs.writeFileSync(PLUGINS_FILE, content);
p.log.success(`Removed ${target.value} from plugins.mjs`);

// Offer to delete the config template if one exists
if (target.config) {
	const templatePath = path.join(TEMPLATES_DIR, target.config);
	if (fs.existsSync(templatePath)) {
		const deleteTemplate = await p.confirm({
			message: `Also delete cli/templates/plugins/${target.config}?`,
			initialValue: true,
		});
		if (!p.isCancel(deleteTemplate) && deleteTemplate) {
			fs.rmSync(templatePath);
			p.log.success(`Deleted cli/templates/plugins/${target.config}`);
		}
	}
}

p.outro(pc.green(`${target.label} removed from ${target.listLabel === 'LR' ? 'LR' : 'third-party'} plugins.`));
