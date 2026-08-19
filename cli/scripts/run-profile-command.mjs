#!/usr/bin/env node

import { spawnSync } from 'child_process';
import { readSetupManifest } from '../actions/setupManifest.mjs';
import { resolveCraftProfile } from '../config/craft-profiles.mjs';

const aliases = {
	'schema-version': 'schemaVersion',
	install: 'projectInstall',
	up: 'projectUp',
	'setup-keys': 'setupKeys',
	update: 'update',
	'resave-entries': 'resaveEntries',
};

const [alias, ...extraArgs] = process.argv.slice(2);
const commandKey = aliases[alias];
if (!commandKey) {
	console.error(`Unknown profile command "${alias || '(missing)'}".`);
	process.exit(1);
}

try {
	const profile = resolveCraftProfile(readSetupManifest()?.craft);
	const result = spawnSync('ddev', ['exec', ...profile.commands[commandKey], ...extraArgs], { stdio: 'inherit' });
	if (result.error) throw result.error;
	process.exit(result.status ?? 1);
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
