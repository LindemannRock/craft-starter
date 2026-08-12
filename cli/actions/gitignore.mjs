/**
 * Strip starter-only entries from `.gitignore` when scaffolding a downstream
 * project. The starter repo needs these ignored (plugin-dev churn), but a
 * real project should commit them for reproducibility / deploys.
 *
 * Strips temporary ignores for lock files and generated Project Config.
 * Also toggles whether built frontend files should be committed.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';

const GITIGNORE = path.join(ROOT, '.gitignore');

const LOCK_FILES_SECTION_REGEX = /\n# Lock files — TEMPORARY[\s\S]*?\/package-lock\.json\n/;
const PROJECT_CONFIG_SECTION_REGEX = /\n# Project config — TEMPORARY[\s\S]*?\/config\/project\/\n/;
const BUILD_FILES_SECTION_REGEX = /\n# Build files\n\/web\/dist\/\n/;

export function updateGitignore({ commitBuildFiles = true } = {}) {
	if (!fs.existsSync(GITIGNORE)) return;
	let content = fs.readFileSync(GITIGNORE, 'utf-8');
	content = stripStarterOnlyIgnores(content);
	content = setBuildFilesIgnored(content, !commitBuildFiles);
	// Collapse any extra blank lines left behind
	content = content.replace(/\n{3,}/g, '\n\n');
	fs.writeFileSync(GITIGNORE, content);
}

/**
 * Remove ignores that only make sense while developing the starter itself.
 * Generated projects must commit their lockfiles and Project Config so Craft
 * can reproduce plugin/schema state in every deployment environment.
 */
export function stripStarterOnlyIgnores(content) {
	return content
		.replace(LOCK_FILES_SECTION_REGEX, '\n')
		.replace(PROJECT_CONFIG_SECTION_REGEX, '\n')
		.replace(/\n{3,}/g, '\n\n');
}

export function setBuildFilesIgnored(content, ignored) {
	if (!ignored) {
		return content.replace(BUILD_FILES_SECTION_REGEX, '\n');
	}
	if (BUILD_FILES_SECTION_REGEX.test(content) || /^\/web\/dist\/$/m.test(content)) {
		return content;
	}
	return content.replace(
		/(# Web assets\n)/,
		'# Build files\n/web/dist/\n\n$1',
	);
}
