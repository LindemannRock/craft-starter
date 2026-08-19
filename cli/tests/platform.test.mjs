import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import { applyPlatformScaffold } from '../actions/platform.mjs';
import { resolveCraftProfile } from '../config/craft-profiles.mjs';

const tempDirs = [];
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function tempDir(prefix) {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
	tempDirs.push(directory);
	return directory;
}

function write(root, relativePath, content = 'fixture\n') {
	const target = path.join(root, relativePath);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, content);
}

afterEach(() => {
	for (const directory of tempDirs.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('platform scaffold', () => {
	it('materializes the official Craft 6 architecture and preserves starter content', () => {
		const root = tempDir('craft-platform-root-');
		const scaffoldRoot = tempDir('craft-platform-source-');
		const profile = resolveCraftProfile('craft6');

		write(root, 'templates/index.twig', 'starter template\n');
		write(root, 'web/index.php', 'old web entry\n');
		write(root, 'translations/en/site.php', 'translation\n');
		write(root, 'config/routes.php', '<?php return [];\n');
		write(root, 'config/license.key', 'license\n');
		write(root, 'bootstrap.php');
		write(root, 'config/general.php');
		write(root, 'config/vite.php');
		write(root, 'cli/templates/platforms/craft6/overlay/vite.config.mjs', 'overlay\n');
		write(root, 'cli/templates/platforms/craft6/overlay/config/craft/general.php', '<?php return [];\n');

		for (const relativePath of profile.scaffold.copy) {
			if (['app', 'bootstrap', 'database', 'routes', 'storage'].includes(relativePath)) {
				write(scaffoldRoot, `${relativePath}/.gitkeep`);
				continue;
			}
			write(
				scaffoldRoot,
				relativePath,
				relativePath === 'config/app.php' ? "<?php return [\n    'timezone' => 'UTC',\n];\n" : 'official\n',
			);
		}
		write(scaffoldRoot, 'bootstrap/app.php', '<?php return null;\n');

		expect(applyPlatformScaffold({ craftProfile: profile, root, scaffoldRoot })).toBe(true);
		expect(fs.readFileSync(path.join(root, 'resources/views/index.twig'), 'utf-8')).toBe('starter template\n');
		expect(fs.readFileSync(path.join(root, 'public/index.php'), 'utf-8')).toBe('official\n');
		expect(fs.readFileSync(path.join(root, 'lang/en/site.php'), 'utf-8')).toBe('translation\n');
		expect(fs.existsSync(path.join(root, 'config/craft/routes.php'))).toBe(true);
		expect(fs.existsSync(path.join(root, 'config/craft/license.key'))).toBe(true);
		expect(fs.existsSync(path.join(root, 'bootstrap.php'))).toBe(false);
		expect(fs.readFileSync(path.join(root, 'vite.config.mjs'), 'utf-8')).toBe('overlay\n');
		expect(fs.readFileSync(path.join(root, 'config/app.php'), 'utf-8')).toContain(
			"'timezone' => env('CRAFT_TIMEZONE', 'UTC')",
		);

		write(root, 'resources/views/index.twig', 'user edit\n');
		expect(applyPlatformScaffold({ craftProfile: profile, root, scaffoldRoot })).toBe(false);
		expect(fs.readFileSync(path.join(root, 'resources/views/index.twig'), 'utf-8')).toBe('user edit\n');
	});

	it('routes Laravel Vite HMR through the DDEV HTTPS origin', () => {
		const vite = fs.readFileSync(
			path.join(repositoryRoot, 'cli/templates/platforms/craft6/overlay/vite.config.mjs'),
			'utf-8',
		);
		expect(vite).toContain("loadEnv(mode, process.cwd(), '')");
		expect(vite).toContain('const devOrigin = `${appUrl.protocol}//${appUrl.hostname}:3000`');
		expect(vite).toContain("protocol: appUrl.protocol === 'https:' ? 'wss' : 'ws'");
	});
});
