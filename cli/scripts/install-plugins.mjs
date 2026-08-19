#!/usr/bin/env node

import { readSetupManifest } from '../actions/setupManifest.mjs';
import { activatePlugins } from '../actions/plugins.mjs';
import { CORE_PLUGIN_HANDLES, HOSTING_OPTIONS } from '../config/plugins.mjs';

const manifest = readSetupManifest();
if (!manifest) {
	console.log('No Craft Starter manifest found; plugin state will be applied from Project Config.');
	process.exit(0);
}

const hosting = HOSTING_OPTIONS.find(({ value }) => value === manifest.hosting);
const plan = [
	...CORE_PLUGIN_HANDLES.map((handle) => ({ handle })),
	...(manifest.plugins || []),
	...(hosting?.packages || []).filter(({ handle }) => handle),
];

try {
	await activatePlugins(plan);
	console.log(`Plugin plan applied (${plan.length} plugin${plan.length === 1 ? '' : 's'}).`);
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
