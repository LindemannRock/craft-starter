/**
 * Updates package.json with the project name and description.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';

export function updatePackageJson({ name, description }) {
	const pkgPath = path.join(ROOT, 'package.json');
	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
	pkg.name = name;
	pkg.description = description || '';
	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
}
