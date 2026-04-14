/**
 * Plugin-related actions: writing config files, activating plugins after install.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT, CLI_DIR } from '../paths.mjs';
import { run } from '../utils/run.mjs';

const PLUGIN_TEMPLATES_DIR = path.join(CLI_DIR, 'templates', 'plugins');

/**
 * Copy plugin config files from cli/templates/plugins/ into config/ for
 * every selected plugin that has one.
 *
 */
export function writePluginConfigs(allSelectedPlugins) {
	for (const pl of allSelectedPlugins) {
		if (!pl.config) continue;
		const src = path.join(PLUGIN_TEMPLATES_DIR, pl.config);
		const dest = path.join(ROOT, 'config', pl.config);
		if (fs.existsSync(src)) {
			fs.copyFileSync(src, dest);
		}
	}
}

/**
 * Run `php craft plugin/install` for each handle inside the DDEV container.
 *
 */
export async function activatePlugins(handles) {
	for (const handle of handles) {
		await run(`ddev exec php craft plugin/install ${handle}`);
	}
}

/**
 * Clear any stale plugin config files from the config/ folder that belong to
 * plugins NOT in the current selection. Prevents leftover configs from
 * previous runs.
 *
 */
export function cleanUnusedPluginConfigs(allPluginDefs, selectedNow) {
	const selectedConfigs = new Set(
		selectedNow.filter((p) => p.config).map((p) => p.config)
	);
	for (const pl of allPluginDefs) {
		if (!pl.config) continue;
		if (selectedConfigs.has(pl.config)) continue;
		const staleConfig = path.join(ROOT, 'config', pl.config);
		if (fs.existsSync(staleConfig)) {
			fs.rmSync(staleConfig);
		}
	}
}
