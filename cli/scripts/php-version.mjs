#!/usr/bin/env node

/**
 * Update PHP version across `.ddev/config.yaml` + `composer.json` in one step.
 *
 * Interactive (no args):
 *   make php-version          → prompts for version
 *
 * Direct:
 *   make php-version VERSION=8.5
 *
 * After running, `ddev restart` is required for the new image to build.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { setPhpVersion } from '../actions/php.mjs';
import { readSetupManifest } from '../actions/setupManifest.mjs';
import { resolveCraftProfile } from '../config/craft-profiles.mjs';
import { cancel } from '../utils/cancel.mjs';

const cliVersion = process.env.VERSION;
const craftProfile = resolveCraftProfile(readSetupManifest()?.craft);

p.intro(pc.bgCyan(pc.black(' PHP Version ')));

let version = cliVersion;

if (!version) {
	const choice = await p.select({
		message: 'PHP version',
		options: [...craftProfile.php.options, { value: 'cancel', label: pc.red('Cancel') }],
		initialValue: craftProfile.php.default,
	});
	if (p.isCancel(choice) || choice === 'cancel') cancel();
	version = choice;
}

try {
	setPhpVersion(version, { craftProfile });
} catch (err) {
	p.log.error(err.message);
	process.exit(1);
}

p.log.success(`Updated .ddev/config.yaml + composer.json to PHP ${version}`);
p.outro('Run ' + pc.bold('ddev restart') + ' to rebuild the web image.');
