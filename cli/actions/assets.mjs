/** Profile-aware synchronization of starter-owned static assets. */

import fs from 'fs';
import path from 'path';
import { ROOT, CLI_DIR } from '../paths.mjs';
import { craftProjectPath } from '../config/craft-profiles.mjs';

export function syncRebrandAssets({ root = ROOT, cliDir = CLI_DIR, craftProfile, overwrite = false } = {}) {
	const source = path.join(cliDir, 'templates', 'rebrand');
	const destination = craftProjectPath(root, 'rebrand', craftProfile);
	if (!fs.existsSync(source) || (!overwrite && fs.existsSync(destination))) return false;
	fs.cpSync(source, destination, { recursive: true, force: overwrite });
	return true;
}
