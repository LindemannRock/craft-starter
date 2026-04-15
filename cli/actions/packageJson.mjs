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

export function updatePackageJson({ name, description }, { useCritical = true } = {}) {
	const pkgPath = path.join(ROOT, 'package.json');
	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
	pkg.name = name;
	pkg.description = description || '';

	if (!useCritical && pkg.devDependencies) {
		delete pkg.devDependencies['rollup-plugin-critical'];
	}

	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
}
