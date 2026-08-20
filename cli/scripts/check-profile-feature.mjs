#!/usr/bin/env node

/** Exit successfully when the active Craft profile supports a feature. */

import { readSetupManifest } from '../actions/setupManifest.mjs';
import { resolveCraftProfile } from '../config/craft-profiles.mjs';

const FEATURE_LABELS = Object.freeze({
	criticalCss: 'Critical CSS',
});

const feature = process.argv[2];
const label = FEATURE_LABELS[feature];
if (!label) {
	console.error(`Unknown Craft profile feature: ${feature || '(missing)'}`);
	process.exit(2);
}

const profile = resolveCraftProfile(readSetupManifest()?.craft);
if (!profile.features[feature]) {
	console.log(`${label} is not enabled yet for the experimental ${profile.label} profile.`);
	console.log('No project files were changed.');
	process.exit(1);
}
