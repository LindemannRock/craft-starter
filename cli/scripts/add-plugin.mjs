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
		const res = await fetch(
			`https://packagist.org/search.json?q=${encodeURIComponent(query)}&type=craft-plugin&per_page=15`,
			{ signal: AbortSignal.timeout(15_000) },
		);
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
			.filter(
				(v) =>
					!v.version.includes('dev') &&
					!v.version.includes('alpha') &&
					!v.version.includes('beta') &&
					!v.version.includes('RC'),
			)
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
		.split('/')
		.pop()
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
			const res = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${p}`, {
				signal: AbortSignal.timeout(15_000),
			});
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

/**
 * Best-effort edition discovery from the plugin class declared by Composer.
 * Runtime installation performs a second, authoritative check.
 */
async function discoverPluginEditions(details) {
	const sourceUrl = details.source?.url;
	const ref = details.source?.reference;
	const className = details.extra?.class || details.extra?.['craft-plugin']?.class;
	const psr4 = details.autoload?.['psr-4'];
	if (!sourceUrl?.includes('github.com') || !ref || !className || !psr4) return [];

	const namespace = Object.keys(psr4)
		.sort((a, b) => b.length - a.length)
		.find((prefix) => className.startsWith(prefix));
	if (!namespace) return [];

	const sourceDir = String(psr4[namespace]).replace(/^\.\//, '').replace(/\/$/, '');
	const classPath = className.slice(namespace.length).replaceAll('\\', '/');
	const sourcePath = [sourceDir, `${classPath}.php`].filter(Boolean).join('/');
	const match = sourceUrl.match(/github\.com\/([^/]+\/[^/.]+)/);
	if (!match) return [];

	try {
		const response = await fetch(`https://raw.githubusercontent.com/${match[1]}/${ref}/${sourcePath}`, {
			signal: AbortSignal.timeout(15_000),
		});
		if (!response.ok) return [];
		const source = await response.text();
		const body = source.match(/function\s+editions\s*\(\s*\)\s*:\s*array\s*\{[\s\S]*?return\s*\[([\s\S]*?)\];/i)?.[1];
		if (!body) return [];

		const editions = [];
		for (const token of body.split(',')) {
			const literal = token.match(/['"]([a-z0-9_-]+)['"]/i)?.[1];
			const constant = token
				.match(/EDITION_([A-Z0-9_]+)/)?.[1]
				?.toLowerCase()
				.replaceAll('_', '-');
			const value = literal || constant;
			if (value && !editions.includes(value)) editions.push(value);
		}
		return editions.length > 1 ? editions : [];
	} catch {
		return [];
	}
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
	s.stop(
		`Found ${results.length} new result${results.length === 1 ? '' : 's'}${filtered > 0 ? ` (${filtered} already in registry)` : ''}`,
	);

	if (results.length === 0) {
		p.log.warn(
			rawResults.length > 0
				? 'All matching packages are already registered.'
				: 'No Craft plugins found. Try a different search term.',
		);
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
p.log.info(
	`Latest: ${pc.green(latestVersion)}  Handle: ${pc.cyan(handle || '(unknown)')}  List: ${pc.cyan(list === 'lr' ? 'LR Plugins' : 'Third-party')}`,
);

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
	placeholder: packageName
		.split('/')
		.pop()
		.replace(/craft-/i, '')
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase()),
	defaultValue: packageName
		.split('/')
		.pop()
		.replace(/craft-/i, '')
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase()),
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

s.start('Checking Craft plugin editions');
const discoveredEditions = await discoverPluginEditions(details);
s.stop(
	discoveredEditions.length > 1 ? `Found editions: ${discoveredEditions.join(', ')}` : 'No multiple editions detected',
);

let editions = discoveredEditions;
if (editions.length === 0) {
	const editionInput = await p.text({
		message: 'Edition handles (comma-separated; leave empty for a single-edition plugin)',
		placeholder: 'standard, pro',
		validate: (value) => {
			if (!value) return;
			const values = value
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean);
			if (values.some((item) => !/^[a-z0-9-]+$/.test(item))) return 'Use lowercase edition handles separated by commas';
			if (new Set(values).size !== values.length) return 'Edition handles must be unique';
		},
	});
	if (p.isCancel(editionInput)) process.exit(0);
	editions = editionInput
		? editionInput
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean)
		: [];
}

let defaultEdition = null;
if (editions.length > 1) {
	defaultEdition = await p.select({
		message: 'Default edition',
		options: editions.map((edition) => ({ value: edition, label: editionLabel(edition) })),
		initialValue: editions[0],
	});
	if (p.isCancel(defaultEdition)) process.exit(0);
}

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

// IP salt — for plugins that hash IP addresses for privacy-preserving analytics
// (e.g. Redirect/Search/Shortlink/Smartlink Manager). The CLI auto-generates a
// 64-char hex salt and writes it to the named env var during `make create`.
const needsIpSalt = await p.confirm({
	message: 'Does this plugin need an IP salt env var? (privacy-analytics plugins)',
	initialValue: false,
});
if (p.isCancel(needsIpSalt)) process.exit(0);

const ipSaltEnv = needsIpSalt ? (pluginHandle || handle).toUpperCase().replace(/-/g, '_') + '_IP_SALT' : null;

// Build the entry
const entry = {
	value: packageName,
	handle: pluginHandle || handle,
	version: version || suggestedConstraint,
	label: label || packageName,
	hint: hint || '',
	config: configFile || null,
	...(ipSaltEnv ? { ipSaltEnv } : {}),
	...(editions.length > 1
		? {
				editions: editions.map((edition) => ({ value: edition, label: editionLabel(edition) })),
				defaultEdition,
			}
		: {}),
};

// Show preview
p.note(
	Object.entries(entry)
		.map(([k, v]) => `${pc.bold(k)}: ${v === null ? pc.dim('null') : v}`)
		.join('\n'),
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
\t\tconfig: ${entry.config ? `'${entry.config}'` : 'null'},${entry.ipSaltEnv ? `\n\t\tipSaltEnv: '${entry.ipSaltEnv}',` : ''}${entry.editions ? `\n\t\teditions: ${JSON.stringify(entry.editions)},\n\t\tdefaultEdition: '${entry.defaultEdition}',` : ''}
\t},`;

// Find the alphabetical insertion point so the registry file stays sorted.
// Each list (LR_PLUGINS / THIRD_PARTY_PLUGINS) is sorted by `label`. We pick
// the first existing entry whose label sorts after the new entry and insert
// the new entry before it. If none, append at the end.
const targetList = list === 'lr' ? LR_PLUGINS : THIRD_PARTY_PLUGINS;
const successor = targetList.find((pl) => pl.label.localeCompare(entry.label) > 0);

if (successor) {
	// Insert before the successor's `{ ... }` block.
	// Match the start of that block by anchoring on its `value: 'package'` line,
	// then walk back to the `\t{` that opens it.
	const successorEscaped = successor.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const blockOpenRegex = new RegExp(
		`(\\n\\t\\{\\n` + `(?:\\t\\t[^\\n]*\\n)*?` + `\\t\\tvalue:\\s*['"]${successorEscaped}['"])`,
	);
	if (blockOpenRegex.test(content)) {
		content = content.replace(blockOpenRegex, (_match, block) => `\n${entryStr}${block}`);
	} else {
		// Fallback: append before closing `];` (shouldn't happen but safe)
		content = appendAtEnd(content, list, entryStr);
	}
} else {
	content = appendAtEnd(content, list, entryStr);
}

function appendAtEnd(content, list, entryStr) {
	const insertPattern =
		list === 'lr'
			? /(export const LR_PLUGINS = \[[\s\S]*?)(^\];)/m
			: /(export const THIRD_PARTY_PLUGINS = \[[\s\S]*?)(^\];)/m;
	// Function replacer so any `$` inside label/hint is treated literally, not as
	// a back-reference pattern like `$&` / `$1`.
	return content.replace(insertPattern, (_match, before, close) => `${before}${entryStr}\n${close}`);
}

function editionLabel(edition) {
	return edition.replace(/(^|-)(\w)/g, (_match, dash, letter) => `${dash ? ' ' : ''}${letter.toUpperCase()}`);
}

fs.writeFileSync(PLUGINS_FILE, content);

p.outro(pc.green(`${entry.label} added to ${list === 'lr' ? 'LR' : 'third-party'} plugins.`));

if (hasConfig) {
	p.log.info(`Don't forget to create: cli/templates/plugins/${configFile}`);
}
