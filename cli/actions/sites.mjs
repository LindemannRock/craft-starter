/**
 * Multi-site actions: scaffold translation directories and clean unused ones.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT, CLI_DIR } from '../paths.mjs';

const TRANSLATIONS_DIR = path.join(ROOT, 'translations');
const TEMPLATE_FILE = path.join(CLI_DIR, 'templates', 'translations', 'site.php');

/**
 * Create translation directories for each site.
 * Uses the template from cli/templates/translations/ as a base.
 * The filename matches the translation category (default: 'site').
 *
 */
export function scaffoldTranslations(sites, category = 'site') {
	const filename = `${category}.php`;

	// Read the base template
	let template = '';
	if (fs.existsSync(TEMPLATE_FILE)) {
		template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
	}

	for (const site of sites) {
		const langDir = path.join(TRANSLATIONS_DIR, site.handle);
		const targetFile = path.join(langDir, filename);

		fs.mkdirSync(langDir, { recursive: true });

		// Only create the file if it doesn't exist (don't overwrite user edits)
		if (!fs.existsSync(targetFile) && template) {
			fs.writeFileSync(targetFile, template);
		}
	}
}

/**
 * Remove translation directories that don't match any selected site handle.
 *
 */
export function cleanUnusedTranslations(sites) {
	const activeHandles = new Set(sites.map((s) => s.handle));

	if (!fs.existsSync(TRANSLATIONS_DIR)) return;

	for (const entry of fs.readdirSync(TRANSLATIONS_DIR, { withFileTypes: true })) {
		if (entry.isDirectory() && !activeHandles.has(entry.name)) {
			fs.rmSync(path.join(TRANSLATIONS_DIR, entry.name), { recursive: true });
		}
	}
}
