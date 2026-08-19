#!/usr/bin/env node

import { syncRebrandAssets } from '../actions/assets.mjs';
import { readSetupManifest } from '../actions/setupManifest.mjs';
import { resolveCraftProfile } from '../config/craft-profiles.mjs';

try {
	const craft = readSetupManifest()?.craft;
	const profile = resolveCraftProfile(craft);
	if (!profile.features.rebrandAssets) {
		console.log(`Static rebrand asset sync is not enabled for ${profile.label} yet.`);
		process.exit(0);
	}
	syncRebrandAssets({ craftProfile: profile });
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
