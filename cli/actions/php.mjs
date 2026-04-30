/**
 * Sync PHP version across `.ddev/config.yaml` (`php_version`) and
 * `composer.json` (`config.platform.php`). They must match — if DDEV runs
 * 8.3 but composer resolves for 8.2, you get inconsistent dependency
 * resolution.
 *
 * Used by `make create` (during scaffolding) and by `make php-version` for
 * targeted upgrades on existing projects.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';

const SUPPORTED = ['8.2', '8.3', '8.4'];

export function setPhpVersion(version) {
	if (!SUPPORTED.includes(version)) {
		throw new Error(`Unsupported PHP version "${version}". Supported: ${SUPPORTED.join(', ')}`);
	}

	const ddevPath = path.join(ROOT, '.ddev', 'config.yaml');
	const composerPath = path.join(ROOT, 'composer.json');

	// .ddev/config.yaml — single line replacement
	if (fs.existsSync(ddevPath)) {
		let ddev = fs.readFileSync(ddevPath, 'utf-8');
		ddev = ddev.replace(/^php_version: ".*"$/m, `php_version: "${version}"`);
		fs.writeFileSync(ddevPath, ddev);
	}

	// composer.json — parse + write
	if (fs.existsSync(composerPath)) {
		const composer = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
		composer.config ??= {};
		composer.config.platform ??= {};
		composer.config.platform.php = version;
		fs.writeFileSync(composerPath, JSON.stringify(composer, null, '\t') + '\n');
	}
}
