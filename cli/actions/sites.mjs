/**
 * Multi-site actions: scaffold translation directories and clean unused ones.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';
import { craftProjectPath, resolveCraftProfile } from '../config/craft-profiles.mjs';
const MANAGED_COMMENT = '// Managed by Craft Starter. Customized files are preserved during reconfiguration.';

function managedTranslationContent(content) {
	return content.replace(/^<\?php\n/, `<?php\n\n${MANAGED_COMMENT}\n`);
}

/**
 * Create translation directories for each site.
 * Uses the template from cli/templates/translations/ as a base.
 * The filename matches the translation category (default: 'site').
 *
 */
export function scaffoldTranslations(
	sites,
	category = 'site',
	{ root = ROOT, templateRoot = ROOT, craftProfile } = {},
) {
	const profile = resolveCraftProfile(craftProfile);
	const translationsDir = craftProjectPath(root, 'translations', profile);
	const templateFile = craftProjectPath(templateRoot, 'translationTemplate', profile);
	const filename = `${category}.php`;

	// Read the base template
	let template = '';
	if (fs.existsSync(templateFile)) {
		template = fs.readFileSync(templateFile, 'utf-8');
	}

	for (const language of new Set(sites.map((site) => site.language))) {
		const langDir = path.join(translationsDir, language);
		const targetFile = path.join(langDir, filename);

		fs.mkdirSync(langDir, { recursive: true });

		// Only create the file if it doesn't exist (don't overwrite user edits)
		if (!fs.existsSync(targetFile) && template) {
			fs.writeFileSync(targetFile, managedTranslationContent(template));
		}
	}
}

/**
 * Remove only unchanged starter translation files for languages/categories
 * that are no longer selected. Customized translation content is preserved.
 *
 */
export function cleanUnusedTranslations(
	sites,
	{
		previousSites = [],
		previousCategory = 'site',
		category = 'site',
		root = ROOT,
		templateRoot = ROOT,
		craftProfile,
	} = {},
) {
	const profile = resolveCraftProfile(craftProfile);
	const translationsDir = craftProjectPath(root, 'translations', profile);
	const templateFile = craftProjectPath(templateRoot, 'translationTemplate', profile);
	const activeLanguages = new Set(sites.map((site) => site.language));
	const previousLanguages = new Set(previousSites.map((site) => site.language));
	const template = fs.existsSync(templateFile) ? fs.readFileSync(templateFile, 'utf-8') : null;
	if (!template) return [];

	const candidates = [];
	for (const language of previousLanguages) {
		if (!activeLanguages.has(language)) candidates.push([language, previousCategory]);
	}
	if (previousCategory !== category) {
		for (const language of activeLanguages) candidates.push([language, previousCategory]);
	}
	// Migrate projects created before the setup manifest/language-directory fix.
	// Only exact starter templates qualify, so real translated content survives.
	if (fs.existsSync(translationsDir)) {
		for (const entry of fs.readdirSync(translationsDir, { withFileTypes: true })) {
			if (!entry.isDirectory() || activeLanguages.has(entry.name)) continue;
			for (const filename of fs.readdirSync(path.join(translationsDir, entry.name))) {
				if (filename.endsWith('.php')) candidates.push([entry.name, filename.slice(0, -4)]);
			}
		}
	}

	const preserved = [];
	for (const [language, oldCategory] of new Map(
		candidates.map((candidate) => [candidate.join('\0'), candidate]),
	).values()) {
		const oldFile = path.join(translationsDir, language, `${oldCategory}.php`);
		if (!fs.existsSync(oldFile)) continue;
		const current = fs.readFileSync(oldFile, 'utf-8');
		if (current !== template && current !== managedTranslationContent(template)) {
			preserved.push(path.relative(root, oldFile));
			continue;
		}
		fs.rmSync(oldFile);
		const directory = path.dirname(oldFile);
		if (fs.existsSync(directory) && fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
	}
	return preserved;
}
