#!/usr/bin/env node

import { syncRebrandAssets } from '../actions/assets.mjs';
import { readSetupManifest } from '../actions/setupManifest.mjs';

try {
	syncRebrandAssets({ craftProfile: readSetupManifest()?.craft });
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
