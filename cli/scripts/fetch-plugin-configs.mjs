#!/usr/bin/env node

/**
 * Fetch default config.php from each registered plugin's GitHub repo.
 * Useful for pulling in upstream config changes or first-time setup.
 *
 * Usage: make fetch-configs
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { LR_PLUGINS, THIRD_PARTY_PLUGINS } from '../config/plugins.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'plugins');

async function getPackageSource(packageName) {
	try {
		const res = await fetch(`https://repo.packagist.org/p2/${packageName}.json`, { signal: AbortSignal.timeout(15_000) });
		if (!res.ok) return null;
		const data = await res.json();
		const versions = data.packages?.[packageName] || [];
		const stable = versions
			.filter((v) => !v.version.includes('dev') && !v.version.includes('alpha') && !v.version.includes('beta') && !v.version.includes('RC'))
			.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
		return stable[0] || null;
	} catch {
		return null;
	}
}

async function fetchPluginConfig(sourceUrl, ref) {
	if (!sourceUrl?.includes('github.com')) return null;
	const match = sourceUrl.match(/github\.com\/([^/]+\/[^/.]+)/);
	if (!match) return null;
	const repo = match[1];
	const paths = ['src/config.php', 'src/config/config.php'];
	for (const p of paths) {
		try {
			const res = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${p}`, { signal: AbortSignal.timeout(15_000) });
			if (res.ok) {
				const text = await res.text();
				if (text.startsWith('<?php')) return text;
			}
		} catch {
			// try next path
		}
	}
	return null;
}

p.intro(pc.bgCyan(pc.black(' Fetch Plugin Configs ')));

// Only plugins with a config file
const plugins = [...LR_PLUGINS, ...THIRD_PARTY_PLUGINS].filter((pl) => pl.config);

if (plugins.length === 0) {
	p.outro('No plugins with config files in the registry.');
	process.exit(0);
}

// Select which plugins to fetch for
const selected = await p.autocompleteMultiselect({
	message: 'Select plugins to fetch config for',
	options: [...plugins].sort((a, b) => a.label.localeCompare(b.label)).map((pl) => ({
		value: pl.value,
		label: pl.label,
		hint: pl.config,
	})),
	required: false,
});

if (p.isCancel(selected) || selected.length === 0) {
	p.outro('Nothing to fetch.');
	process.exit(0);
}

const s = p.spinner();

for (const pkgName of selected) {
	const plugin = plugins.find((pl) => pl.value === pkgName);
	const templatePath = path.join(TEMPLATES_DIR, plugin.config);
	const exists = fs.existsSync(templatePath);

	if (exists) {
		const overwrite = await p.confirm({
			message: `${plugin.config} exists. Overwrite with upstream config?`,
			initialValue: false,
		});
		if (p.isCancel(overwrite) || !overwrite) {
			p.log.warn(`Skipped ${plugin.label}`);
			continue;
		}
	}

	s.start(`Fetching ${plugin.label}`);
	const details = await getPackageSource(pkgName);
	if (!details) {
		s.stop(pc.red(`${plugin.label} — could not fetch from Packagist`));
		continue;
	}

	const content = await fetchPluginConfig(details.source?.url, details.source?.reference);
	if (content) {
		fs.writeFileSync(templatePath, content);
		s.stop(`${plugin.label} — ${pc.green('fetched')} → ${plugin.config}`);
	} else {
		s.stop(pc.yellow(`${plugin.label} — no config.php found in src/`));
	}
}

p.outro(pc.green('Done.'));
