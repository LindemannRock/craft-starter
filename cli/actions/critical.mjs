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
import { craftProjectPath, resolveCraftProfile } from '../config/craft-profiles.mjs';

// Canonical criticalPath + criticalSuffix lines for config/vite.php.
// Re-inserted on opt-in if they were previously stripped.
const VITE_CONFIG_CRITICAL_LINES = `    'criticalPath' => $distDir . '/criticalcss',
    'criticalSuffix' => '_critical.min.css',
`;

export function applyCriticalCssChoice(useCritical, { root = ROOT, cliDir = CLI_DIR, craftProfile } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const paths = {
		criticalPartial: craftProjectPath(root, 'criticalPartial', profile),
		viteConfig: craftProjectPath(root, 'viteConfig', profile),
		templatesDir: path.join(cliDir, 'templates', 'critical'),
	};
	const preserved = writePartial(useCritical, { root, ...paths });
	patchViteConfig(useCritical, paths.viteConfig);
	return preserved;
}

function writePartial(useCritical, { root, criticalPartial, templatesDir }) {
	const enabledPartial = path.join(templatesDir, 'critical-css.twig');
	const disabledPartial = path.join(templatesDir, 'critical-css-disabled.twig');
	const source = useCritical ? enabledPartial : disabledPartial;
	if (!fs.existsSync(source)) return;
	const content = fs.readFileSync(source, 'utf-8');
	if (fs.existsSync(criticalPartial)) {
		const current = fs.readFileSync(criticalPartial, 'utf-8');
		const canonical = [enabledPartial, disabledPartial]
			.filter((candidate) => fs.existsSync(candidate))
			.flatMap((candidate) => {
				const managed = fs.readFileSync(candidate, 'utf-8');
				const legacy = managed.replace(
					'{# Managed by Craft Starter. Customized files are preserved during reconfiguration. #}\n',
					'',
				);
				return [managed, legacy];
			});
		if (!canonical.includes(current)) return path.relative(root, criticalPartial);
	}
	fs.mkdirSync(path.dirname(criticalPartial), { recursive: true });
	fs.writeFileSync(criticalPartial, content);
	return null;
}

function patchViteConfig(useCritical, viteConfig) {
	if (!fs.existsSync(viteConfig)) return;
	let content = fs.readFileSync(viteConfig, 'utf-8');

	// Always strip existing critical lines first (idempotent)
	content = content.replace(/^\s*'criticalPath' =>.*\n/m, '');
	content = content.replace(/^\s*'criticalSuffix' =>.*\n/m, '');

	if (useCritical) {
		// Insert the two lines before the LAST line-anchored `];` — ensures we
		// hit the closing bracket of the top-level `return [...]` and not a
		// nested array if the config ever grows one.
		const lastClose = content.lastIndexOf('\n];');
		if (lastClose !== -1) {
			content = content.slice(0, lastClose + 1) + VITE_CONFIG_CRITICAL_LINES + content.slice(lastClose + 1);
		}
	}

	fs.writeFileSync(viteConfig, content);
}
