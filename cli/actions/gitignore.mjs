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
import { resolveCraftProfile } from '../config/craft-profiles.mjs';

const LOCK_FILES_SECTION_REGEX = /\n# Lock files — TEMPORARY[\s\S]*?\/package-lock\.json\n/;

export function updateGitignore({ commitBuildFiles = true, craftProfile, root = ROOT } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const gitignore = path.join(root, '.gitignore');
	if (!fs.existsSync(gitignore)) return;
	let content = fs.readFileSync(gitignore, 'utf-8');
	content = stripStarterOnlyIgnores(content, { craftProfile: profile });
	content = setBuildFilesIgnored(content, !commitBuildFiles, { craftProfile: profile });
	// Collapse any extra blank lines left behind
	content = content.replace(/\n{3,}/g, '\n\n');
	fs.writeFileSync(gitignore, content);
}

/**
 * Remove ignores that only make sense while developing the starter itself.
 * Generated projects must commit their lockfiles and Project Config so Craft
 * can reproduce plugin/schema state in every deployment environment.
 */

export function stripStarterOnlyIgnores(content, { craftProfile } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const projectConfig = escapeRegex(`/${profile.paths.projectConfig}/`);
	const projectConfigSection = new RegExp(`\\n# Project config — TEMPORARY[\\s\\S]*?${projectConfig}\\n`);
	return content
		.replace(LOCK_FILES_SECTION_REGEX, '\n')
		.replace(projectConfigSection, '\n')
		.replace(/\n{3,}/g, '\n\n');
}

export function setBuildFilesIgnored(content, ignored, { craftProfile } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const buildLine = `/${profile.paths.build}/`;
	const escapedBuildLine = escapeRegex(buildLine);
	const buildFilesSection = new RegExp(`\\n# Build files\\n${escapedBuildLine}\\n`);
	if (!ignored) {
		return content.replace(buildFilesSection, '\n');
	}
	if (buildFilesSection.test(content) || new RegExp(`^${escapedBuildLine}$`, 'm').test(content)) {
		return content;
	}
	return content.replace(/(# Web assets\n)/, `# Build files\n${buildLine}\n\n$1`);
}

function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
