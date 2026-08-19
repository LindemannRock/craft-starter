/**
 * Updates package.json with the project name and description.
 * Also strips opt-in devDependencies that weren't selected during `make create`.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';
import { OPTIONAL_DEV_DEPENDENCIES } from '../config/packages.mjs';
import { allManagedFrontendPackages, resolveCraftProfile } from '../config/craft-profiles.mjs';

export function updatePackageJson(
	{ name, description },
	{ useCritical = true, hasIconManager = false, craftProfile, root = ROOT } = {},
) {
	const profile = resolveCraftProfile(craftProfile);
	const pkgPath = path.join(root, 'package.json');
	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
	pkg.name = name;
	pkg.description = description || '';

	pkg.devDependencies ??= {};
	for (const packageName of allManagedFrontendPackages()) delete pkg.devDependencies[packageName];
	Object.assign(pkg.devDependencies, profile.frontend.devDependencies);

	toggleDevDep(pkg, 'rollup-plugin-critical', useCritical);
	toggleDevDep(pkg, 'svgo', hasIconManager);

	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
}

function toggleDevDep(pkg, name, keep) {
	if (keep) {
		pkg.devDependencies[name] = OPTIONAL_DEV_DEPENDENCIES[name];
	} else {
		delete pkg.devDependencies[name];
	}
}
