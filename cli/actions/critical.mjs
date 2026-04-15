/**
 * Toggles critical-CSS-related files based on the user's choice during
 * `make create`. Idempotent — re-running with a different choice cleanly
 * restores or strips references.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ROOT } from '../paths.mjs';

const CRITICAL_PARTIAL_REL = 'templates/_boilerplate/_partials/critical-css.twig';
const VITE_CONFIG_REL = 'config/vite.php';

const CRITICAL_PARTIAL = path.join(ROOT, CRITICAL_PARTIAL_REL);
const VITE_CONFIG = path.join(ROOT, VITE_CONFIG_REL);

// Simple fallback when critical is declined — the outer layout still includes
// this partial, so we need *something* that renders the main entry.
const SIMPLE_PARTIAL = `{# CSS + JS entry — critical CSS disabled #}
{{ craft.vite.script('src/js/main.ts') }}
`;

export function applyCriticalCssChoice(useCritical) {
	if (useCritical) {
		// Restore the committed versions (no-ops when files already match git)
		restoreFromGit(CRITICAL_PARTIAL_REL);
		restoreFromGit(VITE_CONFIG_REL);
		return;
	}

	if (fs.existsSync(CRITICAL_PARTIAL)) {
		fs.writeFileSync(CRITICAL_PARTIAL, SIMPLE_PARTIAL);
	}

	if (fs.existsSync(VITE_CONFIG)) {
		let content = fs.readFileSync(VITE_CONFIG, 'utf-8');
		content = content.replace(/^\s*'criticalPath' =>.*\n/m, '');
		content = content.replace(/^\s*'criticalSuffix' =>.*\n/m, '');
		fs.writeFileSync(VITE_CONFIG, content);
	}
}

function restoreFromGit(relPath) {
	try {
		execSync(`git checkout HEAD -- ${relPath}`, { cwd: ROOT, stdio: 'ignore' });
	} catch {
		// ignore — file stays as-is if git unavailable
	}
}
