/**
 * Writes composer.json from the selected plugins.
 *
 * Reconciles generator-owned dependencies while preserving packages the
 * project added manually.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';
import {
	CORE_REQUIRE,
	CORE_REQUIRE_DEV,
	HOSTING_OPTIONS,
	LR_PLUGINS,
	REDIS_PACKAGE,
	THIRD_PARTY_PLUGINS,
} from '../config/plugins.mjs';

export function updateComposer({ selectedLr, selectedTp, selectedHosting, useRedisCache }, { root = ROOT } = {}) {
	const composerPath = path.join(root, 'composer.json');
	const composer = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));

	composer.require ??= {};
	composer['require-dev'] ??= {};

	// Remove only packages previously owned by the generator. Dependencies a
	// project added manually remain untouched across a full setup reset.
	const managedPackages = new Set([
		REDIS_PACKAGE.name,
		...LR_PLUGINS.map((plugin) => plugin.value),
		...THIRD_PARTY_PLUGINS.map((plugin) => plugin.value),
		...HOSTING_OPTIONS.flatMap((hosting) => hosting.packages.map((pkg) => pkg.name)),
	]);
	for (const packageName of managedPackages) delete composer.require[packageName];
	Object.assign(composer.require, CORE_REQUIRE);
	Object.assign(composer['require-dev'], CORE_REQUIRE_DEV);

	// Optional infrastructure
	if (useRedisCache) {
		composer.require[REDIS_PACKAGE.name] = REDIS_PACKAGE.version;
	}

	// Add selections
	for (const pl of selectedLr) {
		composer.require[pl.value] = pl.version;
	}
	for (const pl of selectedTp) {
		composer.require[pl.value] = pl.version;
	}
	for (const pkg of selectedHosting.packages) {
		composer.require[pkg.name] = pkg.version;
	}

	fs.writeFileSync(composerPath, JSON.stringify(composer, null, '\t') + '\n');
}
