#!/usr/bin/env node

/**
 * Update PHP version across `.ddev/config.yaml` + `composer.json` in one step.
 *
 * Interactive (no args):
 *   make php-version          → prompts for version
 *
 * Direct:
 *   make php-version VERSION=8.4
 *
 * After running, `ddev restart` is required for the new image to build.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { setPhpVersion } from '../actions/php.mjs';
import { cancel } from '../utils/cancel.mjs';

const cliVersion = process.env.VERSION;

p.intro(pc.bgCyan(pc.black(' PHP Version ')));

let version = cliVersion;

if (!version) {
	const choice = await p.select({
		message: 'PHP version',
		options: [
			{ value: '8.3', label: '8.3', hint: 'recommended (Craft 5 default)' },
			{ value: '8.2', label: '8.2', hint: 'Craft 5 minimum' },
			{ value: 'cancel', label: pc.red('Cancel') },
		],
	});
	if (p.isCancel(choice) || choice === 'cancel') cancel();
	version = choice;
}

try {
	setPhpVersion(version);
} catch (err) {
	p.log.error(err.message);
	process.exit(1);
}

p.log.success(`Updated .ddev/config.yaml + composer.json to PHP ${version}`);
p.outro('Run ' + pc.bold('ddev restart') + ' to rebuild the web image.');
