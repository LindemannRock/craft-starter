/**
 * Writes composer.json from the selected plugins.
 *
 * Resets require/require-dev to the core set on every run so stale entries
 * from previous selections don't bleed through.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';
import { CORE_REQUIRE, CORE_REQUIRE_DEV, REDIS_PACKAGE } from '../config/plugins.mjs';

export function updateComposer({ selectedLr, selectedTp, selectedHosting, useRedis }) {
	const composerPath = path.join(ROOT, 'composer.json');
	const composer = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));

	// Reset require sections to core only
	composer.require = { ...CORE_REQUIRE };
	composer['require-dev'] = { ...CORE_REQUIRE_DEV };

	// Optional infrastructure
	if (useRedis) {
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
