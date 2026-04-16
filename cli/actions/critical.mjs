/**
 * Toggles critical-CSS-related files based on the user's choice during
 * `make create`. Reads canonical variants from `cli/templates/critical/` so
 * round-tripping works regardless of what's been committed to git HEAD.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT, CLI_DIR } from '../paths.mjs';

const CRITICAL_PARTIAL = path.join(ROOT, 'templates', '_boilerplate', '_partials', 'critical-css.twig');
const VITE_CONFIG = path.join(ROOT, 'config', 'vite.php');

const TEMPLATES_DIR = path.join(CLI_DIR, 'templates', 'critical');
const ENABLED_PARTIAL = path.join(TEMPLATES_DIR, 'critical-css.twig');
const DISABLED_PARTIAL = path.join(TEMPLATES_DIR, 'critical-css-disabled.twig');

// Canonical criticalPath + criticalSuffix lines for config/vite.php.
// Re-inserted on opt-in if they were previously stripped.
const VITE_CONFIG_CRITICAL_LINES = `    'criticalPath' => Craft::getAlias($distDir) . '/criticalcss',
    'criticalSuffix' => '_critical.min.css',
`;

export function applyCriticalCssChoice(useCritical) {
	writePartial(useCritical);
	patchViteConfig(useCritical);
}

function writePartial(useCritical) {
	const source = useCritical ? ENABLED_PARTIAL : DISABLED_PARTIAL;
	if (!fs.existsSync(source)) return;
	const content = fs.readFileSync(source, 'utf-8');
	fs.mkdirSync(path.dirname(CRITICAL_PARTIAL), { recursive: true });
	fs.writeFileSync(CRITICAL_PARTIAL, content);
}

function patchViteConfig(useCritical) {
	if (!fs.existsSync(VITE_CONFIG)) return;
	let content = fs.readFileSync(VITE_CONFIG, 'utf-8');

	// Always strip existing critical lines first (idempotent)
	content = content.replace(/^\s*'criticalPath' =>.*\n/m, '');
	content = content.replace(/^\s*'criticalSuffix' =>.*\n/m, '');

	if (useCritical) {
		// Insert the two lines before the closing `];` of the return array
		content = content.replace(/^\];\s*$/m, `${VITE_CONFIG_CRITICAL_LINES}];\n`);
	}

	fs.writeFileSync(VITE_CONFIG, content);
}
