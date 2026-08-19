/**
 * Plugin-related actions: writing config files, activating plugins after install.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { ROOT, CLI_DIR } from '../paths.mjs';
import { craftProjectPath, resolveCraftProfile } from '../config/craft-profiles.mjs';

const PLUGIN_TEMPLATES_DIR = path.join(CLI_DIR, 'templates', 'plugins');
const MANAGED_COMMENT = '// Managed by Craft Starter. Customized files are preserved during reconfiguration.';

function managedPhpContent(content) {
	return content.replace(/^<\?php\n/, `<?php\n\n${MANAGED_COMMENT}\n`);
}

/**
 * Copy plugin config files from cli/templates/plugins/ into config/ for
 * every selected plugin that has one.
 *
 */
export function writePluginConfigs(allSelectedPlugins, { root = ROOT, craftProfile } = {}) {
	const pluginConfigDir = craftProjectPath(root, 'pluginConfig', craftProfile);
	fs.mkdirSync(pluginConfigDir, { recursive: true });
	for (const pl of allSelectedPlugins) {
		if (!pl.config) continue;
		const src = path.join(PLUGIN_TEMPLATES_DIR, pl.config);
		const dest = path.join(pluginConfigDir, pl.config);
		if (fs.existsSync(src) && !fs.existsSync(dest)) {
			fs.writeFileSync(dest, managedPhpContent(fs.readFileSync(src, 'utf-8')));
		}
	}
}

/**
 * Run `php craft plugin/install` for each handle inside the DDEV container.
 *
 * Edition metadata is verified against the installed plugin classes first.
 * Only Craft's explicit "already installed" result is treated as idempotent;
 * every other failure is surfaced with its original stdout/stderr.
 *
 */
export async function activatePlugins(plugins, { craftProfile } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const plan = plugins
		.map((plugin) => (typeof plugin === 'string' ? { handle: plugin } : plugin))
		.filter(({ handle }) => Boolean(handle));
	validatePluginEditions(plan, { craftProfile: profile });

	for (const { handle, edition } of plan) {
		const args = pluginInstallArgs({ handle, edition }, { craftProfile: profile });
		try {
			execFileSync('ddev', args, { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
		} catch (error) {
			const output = `${error.stdout || ''}${error.stderr || ''}`;
			if (/is already installed\./i.test(output)) continue;
			if (error.stdout) console.log(String(error.stdout).trimEnd());
			if (error.stderr) console.error(String(error.stderr).trimEnd());
			throw new Error(`Failed to install Craft plugin "${handle}"${edition ? ` (${edition})` : ''}.`);
		}
	}
}

export function pluginInstallArgs({ handle, edition }, { craftProfile } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const args = ['exec', ...profile.commands.pluginInstall, handle];
	if (edition) args.push(edition);
	args.push('--interactive=0');
	return args;
}

export function validatePluginEditions(plan, { inspector = inspectPluginEditions, craftProfile } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const candidates = plan.filter(({ handle }) => handle);
	if (candidates.length === 0) return;
	const actual = inspector(
		candidates.map(({ handle }) => handle),
		profile,
	);
	for (const plugin of candidates) {
		const editions = actual[plugin.handle] || [];
		if (editions.length < 2) continue;
		if (!plugin.edition) {
			throw new Error(
				`Plugin "${plugin.handle}" has multiple editions (${editions.join(', ')}) but the starter registry has no edition metadata.`,
			);
		}
		if (!editions.includes(plugin.edition)) {
			throw new Error(
				`Edition "${plugin.edition}" is invalid for "${plugin.handle}". Available editions: ${editions.join(', ')}.`,
			);
		}
	}
}

function inspectPluginEditions(handles, craftProfile) {
	const profile = resolveCraftProfile(craftProfile);
	try {
		const output = execFileSync('ddev', ['exec', ...profile.commands.editionInspector, ...handles], {
			cwd: ROOT,
			encoding: 'utf-8',
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		const marker = output.split('\n').find((line) => line.startsWith('CRAFT_STARTER_EDITIONS='));
		if (!marker) throw new Error('edition inspector returned no data');
		return JSON.parse(marker.slice('CRAFT_STARTER_EDITIONS='.length));
	} catch (error) {
		if (error.stderr) console.error(String(error.stderr).trimEnd());
		throw new Error(`Could not inspect Craft plugin editions: ${error.message}`);
	}
}

/**
 * Clear any stale plugin config files from the config/ folder that belong to
 * plugins NOT in the current selection. Prevents leftover configs from
 * previous runs.
 *
 */
export function cleanUnusedPluginConfigs(allPluginDefs, selectedNow, { root = ROOT, craftProfile } = {}) {
	const pluginConfigDir = craftProjectPath(root, 'pluginConfig', craftProfile);
	const selectedConfigs = new Set(selectedNow.filter((p) => p.config).map((p) => p.config));
	const preserved = [];
	for (const pl of allPluginDefs) {
		if (!pl.config) continue;
		if (selectedConfigs.has(pl.config)) continue;
		const staleConfig = path.join(pluginConfigDir, pl.config);
		if (fs.existsSync(staleConfig)) {
			const template = path.join(PLUGIN_TEMPLATES_DIR, pl.config);
			const templateContent = fs.existsSync(template) ? fs.readFileSync(template, 'utf-8') : null;
			const current = fs.readFileSync(staleConfig, 'utf-8');
			if (templateContent && (current === templateContent || current === managedPhpContent(templateContent))) {
				fs.rmSync(staleConfig);
			} else {
				preserved.push(path.relative(root, staleConfig));
			}
		}
	}
	return preserved;
}

export function syncLrBaseConfig(hasLrPlugins, { root = ROOT, craftProfile } = {}) {
	const pluginConfigDir = craftProjectPath(root, 'pluginConfig', craftProfile);
	const template = path.join(PLUGIN_TEMPLATES_DIR, 'lindemannrock-base.php');
	const destination = path.join(pluginConfigDir, 'lindemannrock-base.php');
	if (hasLrPlugins) {
		if (!fs.existsSync(destination) && fs.existsSync(template)) {
			fs.writeFileSync(destination, managedPhpContent(fs.readFileSync(template, 'utf-8')));
		}
		return null;
	}
	if (!fs.existsSync(destination)) return null;
	const templateContent = fs.existsSync(template) ? fs.readFileSync(template, 'utf-8') : null;
	const current = fs.readFileSync(destination, 'utf-8');
	if (templateContent && (current === templateContent || current === managedPhpContent(templateContent))) {
		fs.rmSync(destination);
		return null;
	}
	return path.relative(root, destination);
}
