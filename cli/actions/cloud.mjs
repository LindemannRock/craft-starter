/**
 * Craft Cloud-specific generator helpers.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import {ROOT} from '../paths.mjs';

/**
 * Cloud builds the frontend and publishes webroot files to its artifact CDN.
 * Normalize choices that rely on a traditional persistent web server.
 */
export function applyCraftCloudDefaults(state) {
	if (state.selectedHosting?.value !== 'craft-cloud') return [];

	const notices = [];
	if (state.useCritical) {
		state.useCritical = false;
		notices.push('Critical CSS disabled — its Nginx SSI delivery is not available on Craft Cloud.');
	}
	if (state.commitBuildFiles) {
		state.commitBuildFiles = false;
		notices.push('web/dist will be ignored — Craft Cloud builds and publishes it to the artifact CDN.');
	}

	return notices;
}

export function craftCloudConfig(phpVersion = '8.3') {
	return [`php-version: '${phpVersion}'`, "node-version: '22'", 'npm-script: build', ''].join('\n');
}

export function writeCraftCloudConfig(phpVersion) {
	fs.writeFileSync(path.join(ROOT, 'craft-cloud.yaml'), craftCloudConfig(phpVersion));
}
