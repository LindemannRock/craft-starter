/**
 * Writes composer.json from the selected plugins.
 *
 * Reconciles generator-owned dependencies while preserving packages the
 * project added manually.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';
import { HOSTING_OPTIONS, LR_PLUGINS, THIRD_PARTY_PLUGINS } from '../config/plugins.mjs';
import {
	allManagedPlatformPackages,
	composerConfigForCraftProfile,
	resolveCraftProfile,
} from '../config/craft-profiles.mjs';

export function updateComposer(
	{ selectedLr, selectedTp, selectedHosting, useRedisCache, craftProfile, craftReleaseChannel },
	{ root = ROOT } = {},
) {
	const composerPath = path.join(root, 'composer.json');
	const composer = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
	const profile = resolveCraftProfile(craftProfile);
	const platform = composerConfigForCraftProfile(profile, craftReleaseChannel);
	// A separate framework scaffold owns its Composer application metadata.
	// The default Craft 5 profile keeps existing scripts/autoload additions
	// intact when a project is reset and created again.
	if (profile.scaffold) applyProjectComposer(composer, platform.project);

	composer.require ??= {};
	composer['require-dev'] ??= {};

	// Remove only packages previously owned by the generator. Dependencies a
	// project added manually remain untouched across a full setup reset.
	const managedPackages = new Set([
		...allManagedPlatformPackages(),
		...LR_PLUGINS.map((plugin) => plugin.value),
		...THIRD_PARTY_PLUGINS.map((plugin) => plugin.value),
		...HOSTING_OPTIONS.flatMap((hosting) => hosting.packages.map((pkg) => pkg.name)),
	]);
	for (const packageName of managedPackages) {
		delete composer.require[packageName];
		delete composer['require-dev'][packageName];
	}
	Object.assign(composer.require, platform.require);
	Object.assign(composer['require-dev'], platform.requireDev);

	// Optional infrastructure
	if (useRedisCache && platform.redis) {
		composer.require[platform.redis.name] = platform.redis.version;
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

function applyProjectComposer(composer, project) {
	setOrDelete(composer, 'autoload', normalizeAutoload(project.autoload));
	setOrDelete(composer, 'autoload-dev', normalizeAutoload(project.autoloadDev));
	setOrDelete(composer, 'scripts', project.scripts ? structuredClone(project.scripts) : null);
	setOrDelete(composer, 'extra', project.extra ? structuredClone(project.extra) : null);

	composer.config ??= {};
	composer.config['allow-plugins'] = { ...project.allowPlugins };
	composer.config['sort-packages'] = true;
	composer.config['optimize-autoloader'] = true;
}

function normalizeAutoload(value) {
	if (!value) return null;
	return { 'psr-4': { ...value.psr4 } };
}

function setOrDelete(target, key, value) {
	if (value === null) delete target[key];
	else target[key] = value;
}
