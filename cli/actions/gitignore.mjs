/**
 * Strip starter-only entries from `.gitignore` when scaffolding a downstream
 * project. The starter repo needs these ignored (plugin-dev churn), but a
 * real project should commit them for reproducibility / deploys.
 *
 * Currently strips: composer.lock, package-lock.json.
 * Also toggles whether built frontend files should be committed.
 * See .internal/task.md for the config/project/ question (deferred).
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';

const GITIGNORE = path.join(ROOT, '.gitignore');

const STRIP_SECTION_REGEX = /\n# Lock files — TEMPORARY[\s\S]*?\/package-lock\.json\n/;
const BUILD_FILES_SECTION_REGEX = /\n# Build files\n\/web\/dist\/\n/;

export function updateGitignore({ commitBuildFiles = true } = {}) {
	if (!fs.existsSync(GITIGNORE)) return;
	let content = fs.readFileSync(GITIGNORE, 'utf-8');
	if (STRIP_SECTION_REGEX.test(content)) {
		content = content.replace(STRIP_SECTION_REGEX, '\n');
	}
	content = setBuildFilesIgnored(content, !commitBuildFiles);
	// Collapse any extra blank lines left behind
	content = content.replace(/\n{3,}/g, '\n\n');
	fs.writeFileSync(GITIGNORE, content);
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
