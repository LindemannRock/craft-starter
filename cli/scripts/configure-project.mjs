#!/usr/bin/env node

import { configureProject } from '../actions/projectConfig.mjs';
import { readSetupManifest } from '../actions/setupManifest.mjs';

try {
	const manifest = readSetupManifest();
	await configureProject({ craftProfile: manifest?.craft });
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
