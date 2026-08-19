/** Materialize framework-owned files for profiles with a separate project architecture. */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { ROOT } from '../paths.mjs';
import { resolveCraftProfile } from '../config/craft-profiles.mjs';

export function applyPlatformScaffold({ craftProfile, root = ROOT, scaffoldRoot } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const scaffold = profile.scaffold;
	if (!scaffold) return false;

	// A pending setup can safely resume without replacing files that may have
	// been edited while diagnosing the failed installation.
	if (isScaffoldMaterialized(profile, root)) {
		return false;
	}

	let temporaryRoot = null;
	try {
		if (!scaffoldRoot) {
			temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${profile.id}-scaffold-`));
			execFileSync(
				'composer',
				[
					'create-project',
					`${scaffold.package}:${scaffold.version}`,
					temporaryRoot,
					'--no-install',
					'--no-scripts',
					'--no-interaction',
					'--ignore-platform-reqs',
				],
				{ cwd: root, stdio: 'pipe' },
			);
			scaffoldRoot = temporaryRoot;
		}

		for (const [sourcePath, destinationPath] of scaffold.moves) {
			mergeMove(path.join(root, sourcePath), path.join(root, destinationPath));
		}
		for (const target of scaffold.remove) {
			fs.rmSync(path.join(root, target), { recursive: true, force: true });
		}
		for (const relativePath of scaffold.copy) {
			const source = path.join(scaffoldRoot, relativePath);
			if (!fs.existsSync(source)) throw new Error(`Official scaffold is missing ${relativePath}.`);
			copy(source, path.join(root, relativePath));
		}

		const overlay = path.join(root, scaffold.overlay);
		if (!fs.existsSync(overlay)) throw new Error(`Craft profile overlay is missing ${scaffold.overlay}.`);
		fs.cpSync(overlay, root, { recursive: true, force: true });
		patchLaravelAppConfig(path.join(root, 'config', 'app.php'));
		return true;
	} finally {
		if (temporaryRoot) fs.rmSync(temporaryRoot, { recursive: true, force: true });
	}
}

function isScaffoldMaterialized(profile, root) {
	const scaffold = profile.scaffold;
	return (
		!fs.existsSync(path.join(root, 'bootstrap.php')) &&
		scaffold.copy.every((relativePath) => fs.existsSync(path.join(root, relativePath))) &&
		fs.existsSync(path.join(root, profile.paths.generalConfig)) &&
		fs.existsSync(path.join(root, profile.paths.viteConfig)) &&
		fs.existsSync(path.join(root, profile.paths.templates))
	);
}

function mergeMove(source, destination) {
	if (!fs.existsSync(source)) return;
	copy(source, destination);
	fs.rmSync(source, { recursive: true, force: true });
}

function copy(source, destination) {
	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.cpSync(source, destination, { recursive: true, force: true });
}

function patchLaravelAppConfig(filename) {
	let content = fs.readFileSync(filename, 'utf-8');
	content = content.replace("'timezone' => 'UTC',", "'timezone' => env('CRAFT_TIMEZONE', 'UTC'),");
	fs.writeFileSync(filename, content);
}
