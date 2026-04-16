#!/usr/bin/env node

/**
 * Interactively add a new plugin to the registry.
 * Searches Packagist, fetches details, and adds to cli/config/plugins.mjs.
 *
 * Usage: make add-plugin
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
const PLUGINS_FILE = path.join(__dirname, '../config/plugins.mjs');

async function searchPackagist(query) {
	try {
		const res = await fetch(`https://packagist.org/search.json?q=${encodeURIComponent(query)}&type=craft-plugin&per_page=15`, { signal: AbortSignal.timeout(15_000) });
		if (!res.ok) return [];
		const data = await res.json();
		return data.results || [];
	} catch {
		return [];
	}
}

async function getPackageDetails(name) {
	try {
		const res = await fetch(`https://repo.packagist.org/p2/${name}.json`, { signal: AbortSignal.timeout(15_000) });
		if (!res.ok) return null;
		const data = await res.json();
		const versions = data.packages?.[name] || [];
		const stable = versions
			.filter((v) => !v.version.includes('dev') && !v.version.includes('alpha') && !v.version.includes('beta') && !v.version.includes('RC'))
			.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
		return stable[0] || null;
	} catch {
		return null;
	}
}

function extractHandle(extra, packageName) {
	// Different plugins declare the handle in different places
	if (extra?.['craft-plugin']?.handle) return extra['craft-plugin'].handle;
	if (extra?.['craft']?.handle) return extra['craft'].handle;
	if (extra?.handle) return extra.handle;
	// Fallback: derive from package name (vendor/craft-foo-bar → foo-bar).
	// Normalize so the prompt validator (`^[a-z0-9-]+$`) accepts it without
	// forcing the user to retype — e.g. `vendor/Foo_Bar` → `foo-bar`.
	return packageName
		.split('/').pop()
		.replace(/^craft-/i, '')
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Fetch the plugin's default src/config.php from GitHub, if it exists.
 * Returns the file contents or null.
 */
async function fetchPluginConfig(sourceUrl, ref) {
	if (!sourceUrl?.includes('github.com')) return null;
	// Convert https://github.com/vendor/repo.git → vendor/repo
	const match = sourceUrl.match(/github\.com\/([^/]+\/[^/.]+)/);
	if (!match) return null;
	const repo = match[1];
	// Try common config file paths
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

p.intro(pc.bgCyan(pc.black(' Add Plugin to Registry ')));

// Check if already registered
const allExisting = [...LR_PLUGINS.map((pl) => pl.value), ...THIRD_PARTY_PLUGINS.map((pl) => pl.value)];

// Search loop — lets the user re-query without restarting the whole command
const s = p.spinner();
let packageName;
let details;
while (true) {
	const query = await p.text({
		message: 'Search Packagist for a Craft plugin',
		placeholder: 'seomatic',
		validate: (v) => {
			if (!v) return 'Enter a search term';
		},
	});
	if (p.isCancel(query)) process.exit(0);

	s.start('Searching Packagist');
	const rawResults = await searchPackagist(query);
	const results = rawResults.filter((r) => !allExisting.includes(r.name));
	const filtered = rawResults.length - results.length;
	s.stop(`Found ${results.length} new result${results.length === 1 ? '' : 's'}${filtered > 0 ? ` (${filtered} already in registry)` : ''}`);

	if (results.length === 0) {
		p.log.warn(rawResults.length > 0
			? 'All matching packages are already registered.'
			: 'No Craft plugins found. Try a different search term.');
		continue;
	}

	const choice = await p.select({
		message: 'Select a package',
		options: [
			...results.slice(0, 10).map((r) => ({
				value: r.name,
				label: r.name,
				hint: r.description?.slice(0, 60) || '',
			})),
			{ value: '__search__', label: pc.dim('Search again'), hint: 'try a different query' },
			{ value: '__cancel__', label: pc.dim('Cancel') },
		],
	});
	if (p.isCancel(choice) || choice === '__cancel__') {
		p.outro('Cancelled.');
		process.exit(0);
	}
	if (choice === '__search__') continue;

	s.start('Fetching package details');
	details = await getPackageDetails(choice);
	s.stop('Details fetched');

	if (!details) {
		p.log.warn('Could not fetch package details. Pick another.');
		continue;
	}
	packageName = choice;
	break;
}

const latestVersion = details.version.replace(/^v/, '');
const handle = extractHandle(details.extra, packageName) || '';
const parts = latestVersion.split('.');
const suggestedConstraint = `^${parts[0]}.${parts[1]}`;

// Auto-detect list from vendor prefix
const list = packageName.startsWith('lindemannrock/') ? 'lr' : 'tp';
p.log.info(`Latest: ${pc.green(latestVersion)}  Handle: ${pc.cyan(handle || '(unknown)')}  List: ${pc.cyan(list === 'lr' ? 'LR Plugins' : 'Third-party')}`);

// Confirm / edit details
const pluginHandle = await p.text({
	message: 'Plugin handle',
	placeholder: handle,
	defaultValue: handle,
	validate: (v) => {
		const val = v || handle;
		if (!val) return 'Handle is required';
		if (!/^[a-z0-9-]+$/.test(val)) return 'Lowercase letters, numbers, hyphens only';
	},
});
if (p.isCancel(pluginHandle)) process.exit(0);

const label = await p.text({
	message: 'Display label',
	placeholder: packageName.split('/').pop().replace(/craft-/i, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
	defaultValue: packageName.split('/').pop().replace(/craft-/i, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
});
if (p.isCancel(label)) process.exit(0);

const hint = await p.text({
	message: 'Short description (shown in CLI)',
	placeholder: details.description || '',
	defaultValue: details.description || '',
});
if (p.isCancel(hint)) process.exit(0);

const version = await p.text({
	message: 'Version constraint',
	placeholder: suggestedConstraint,
	defaultValue: suggestedConstraint,
});
if (p.isCancel(version)) process.exit(0);

const hasConfig = await p.confirm({
	message: 'Does this plugin need a config file in config/?',
	initialValue: false,
});
if (p.isCancel(hasConfig)) process.exit(0);

let configFile = null;
if (hasConfig) {
	configFile = await p.text({
		message: 'Config filename',
		placeholder: `${pluginHandle || handle}.php`,
		defaultValue: `${pluginHandle || handle}.php`,
	});
	if (p.isCancel(configFile)) process.exit(0);

	// Try to fetch the plugin's default config.php from GitHub
	const templatePath = path.join(__dirname, '..', 'templates', 'plugins', configFile);
	if (fs.existsSync(templatePath)) {
		p.log.info(`Template already exists at cli/templates/plugins/${configFile} — keeping existing.`);
	} else {
		s.start('Fetching default config.php from GitHub');
		const configContent = await fetchPluginConfig(details.source?.url, details.source?.reference);
		if (configContent) {
			fs.writeFileSync(templatePath, configContent);
			s.stop(`Fetched config.php → cli/templates/plugins/${configFile}`);
		} else {
			s.stop(pc.yellow(`No config.php found. Create cli/templates/plugins/${configFile} manually.`));
		}
	}
}

// Build the entry
const entry = {
	value: packageName,
	handle: pluginHandle || handle,
	version: version || suggestedConstraint,
	label: label || packageName,
	hint: hint || '',
	config: configFile || null,
};

// Show preview
p.note(
	Object.entries(entry).map(([k, v]) => `${pc.bold(k)}: ${v === null ? pc.dim('null') : v}`).join('\n'),
	'New plugin entry',
);

const confirm = await p.confirm({
	message: 'Add this plugin to the registry?',
	initialValue: true,
});
if (p.isCancel(confirm) || !confirm) {
	p.outro('Cancelled.');
	process.exit(0);
}

// Write to plugins.mjs. Use JSON.stringify for free-text fields (label, hint)
// so quotes / backslashes / newlines in user input get properly escaped and
// don't break JavaScript parsing of plugins.mjs on the next import.
let content = fs.readFileSync(PLUGINS_FILE, 'utf-8');

const entryStr = `\t{
\t\tvalue: '${entry.value}',
\t\thandle: '${entry.handle}',
\t\tversion: '${entry.version}',
\t\tlabel: ${JSON.stringify(entry.label)},
\t\thint: ${JSON.stringify(entry.hint)},
\t\tconfig: ${entry.config ? `'${entry.config}'` : 'null'},
\t},`;

// Function replacer so any `$` inside label/hint is treated literally, not as
// a back-reference pattern like `$&` / `$1`.
const insertPattern = list === 'lr'
	? /(export const LR_PLUGINS = \[[\s\S]*?)(^\];)/m
	: /(export const THIRD_PARTY_PLUGINS = \[[\s\S]*?)(^\];)/m;

content = content.replace(insertPattern, (_match, before, close) => `${before}${entryStr}\n${close}`);

fs.writeFileSync(PLUGINS_FILE, content);

p.outro(pc.green(`${entry.label} added to ${list === 'lr' ? 'LR' : 'third-party'} plugins.`));

if (hasConfig) {
	p.log.info(`Don't forget to create: cli/templates/plugins/${configFile}`);
}
