/**
 * Updates .ddev/config.yaml with the project name and timezone.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';

export function updateDdevConfig({ name, timezone }) {
	const ddevPath = path.join(ROOT, '.ddev', 'config.yaml');
	let ddevConfig = fs.readFileSync(ddevPath, 'utf-8');
	ddevConfig = ddevConfig.replace(/^name: .*/m, `name: ${name}`);
	ddevConfig = ddevConfig.replace(/^timezone: .*/m, `timezone: ${timezone}`);
	fs.writeFileSync(ddevPath, ddevConfig);
}
