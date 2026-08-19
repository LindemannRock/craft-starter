/**
 * Craft Cloud-specific generator helpers.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';

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
	return [
		'# Managed by Craft Starter',
		`php-version: '${phpVersion}'`,
		"node-version: '22'",
		'npm-script: build',
		'',
	].join('\n');
}

export function reconcileCraftCloudConfig({ enabled, phpVersion, root = ROOT }) {
	const configPath = path.join(root, 'craft-cloud.yaml');
	if (enabled) {
		if (fs.existsSync(configPath)) {
			const existing = fs.readFileSync(configPath, 'utf-8');
			const legacyGenerated = /^php-version: '[^']+'\nnode-version: '22'\nnpm-script: build\n$/;
			if (!existing.startsWith('# Managed by Craft Starter\n') && !legacyGenerated.test(existing)) {
				return path.relative(root, configPath);
			}
		}
		fs.writeFileSync(configPath, craftCloudConfig(phpVersion));
		return null;
	}
	if (!fs.existsSync(configPath)) return null;

	const content = fs.readFileSync(configPath, 'utf-8');
	const legacyGenerated = /^php-version: '[^']+'\nnode-version: '22'\nnpm-script: build\n$/;
	if (content.startsWith('# Managed by Craft Starter\n') || legacyGenerated.test(content)) {
		fs.rmSync(configPath);
		return null;
	}
	return path.relative(root, configPath);
}
