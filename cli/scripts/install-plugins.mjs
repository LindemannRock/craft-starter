#!/usr/bin/env node

import { readSetupManifest } from '../actions/setupManifest.mjs';
import { activatePlugins } from '../actions/plugins.mjs';
import { HOSTING_OPTIONS } from '../config/plugins.mjs';
import { catalogForCraftProfile, resolveCraftProfile } from '../config/craft-profiles.mjs';

const manifest = readSetupManifest();
if (!manifest) {
	console.log('No Craft Starter manifest found; plugin state will be applied from Project Config.');
	process.exit(0);
}

const hosting = catalogForCraftProfile(HOSTING_OPTIONS, manifest.craft).find(({ value }) => value === manifest.hosting);
const craftProfile = resolveCraftProfile(manifest.craft);
const plan = [
	...craftProfile.plugins.coreHandles.map((handle) => ({ handle })),
	...(manifest.plugins || []),
	...(hosting?.packages || []).filter(({ handle }) => handle),
];

try {
	await activatePlugins(plan, { craftProfile });
	console.log(`Plugin plan applied (${plan.length} plugin${plan.length === 1 ? '' : 's'}).`);
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
