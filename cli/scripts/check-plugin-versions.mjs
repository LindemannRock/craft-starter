#!/usr/bin/env node

/**
 * Check plugin versions against Packagist and optionally update.
 *
 * Usage:
 *   make check-plugins          Check only
 *   make update-plugins         Interactive — select which to update
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { LR_PLUGINS, THIRD_PARTY_PLUGINS, CORE_REQUIRE, HOSTING_OPTIONS } from '../config/plugins.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGINS_FILE = path.join(__dirname, '../config/plugins.mjs');

const allPackages = [
	...Object.entries(CORE_REQUIRE).map(([name, version]) => ({ name, version, source: 'core' })),
	...LR_PLUGINS.map((pl) => ({ name: pl.value, version: pl.version, source: 'lr' })),
	...THIRD_PARTY_PLUGINS.map((pl) => ({ name: pl.value, version: pl.version, source: '3rd-party' })),
	...HOSTING_OPTIONS.flatMap((h) => h.packages.map((pk) => ({ name: pk.name, version: pk.version, source: `hosting:${h.value}` }))),
];

async function getLatestVersion(packageName) {
	try {
		const res = await fetch(`https://repo.packagist.org/p2/${packageName}.json`, { signal: AbortSignal.timeout(15_000) });
		if (!res.ok) return null;
		const data = await res.json();
		const versions = data.packages?.[packageName] || [];
		const stable = versions
			// Case-insensitive prerelease filter so `rc1` / `Alpha` / `BETA` are caught too.
			// Matches any hyphen-prefixed suffix (the conventional prerelease marker).
			.filter((v) => !/-(dev|alpha|beta|rc|pre)/i.test(v.version))
			.map((v) => v.version.replace(/^v/, ''))
			.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
		return stable[0] || null;
	} catch {
		return null;
	}
}

function parseConstraint(constraint) {
	// Caret/tilde/single-version only. Compound constraints (`>=1.0,<2.0`)
	// collapse weirdly here; warn the caller they need to hand-check.
	if (/,|\|/.test(constraint)) return null;
	return constraint.replace(/[\^~>=<\s]/g, '').split('.').map(Number);
}

function isOutdated(constraint, latest) {
	if (!latest) return false;
	const parsed = parseConstraint(constraint);
	if (!parsed) return false; // compound constraint — skip comparison
	const [cMajor, cMinor] = parsed;
	const [lMajor, lMinor] = latest.split('.').map(Number);
	if (lMajor > cMajor) return true;
	if (lMajor === cMajor && lMinor > cMinor) return true;
	return false;
}

function isMajorBump(constraint, latest) {
	const parsed = parseConstraint(constraint);
	if (!parsed) return false;
	const [cMajor] = parsed;
	const [lMajor] = latest.split('.').map(Number);
	return lMajor > cMajor;
}

function newConstraint(latest) {
	const parts = latest.split('.');
	return `^${parts[0]}.${parts[1]}`;
}

const interactive = process.argv.includes('--update');

p.intro(pc.bgCyan(pc.black(' Plugin Version Check ')));

const s = p.spinner();
s.start('Fetching versions from Packagist');

const results = [];
for (const pkg of allPackages) {
	const latest = await getLatestVersion(pkg.name);
	results.push({ ...pkg, latest });
}

s.stop('Versions fetched');

const outdatedList = [];

for (const r of results) {
	if (!r.latest) {
		p.log.warn(`${r.name} — not found on Packagist`);
	} else if (isOutdated(r.version, r.latest)) {
		const major = isMajorBump(r.version, r.latest);
		const arrow = `${pc.dim(r.version)} → ${major ? pc.red(r.latest + ' MAJOR') : pc.green(r.latest)}`;
		p.log.info(`${r.name}  ${arrow}  ${pc.dim(`(${r.source})`)}`);
		outdatedList.push({ ...r, major });
	} else {
		p.log.success(`${r.name}  ${pc.dim(r.version)}  ${pc.dim('up to date')}`);
	}
}

if (outdatedList.length === 0) {
	p.outro(pc.green('All packages are up to date.'));
	process.exit(0);
}

p.log.step(`${outdatedList.length} package${outdatedList.length === 1 ? '' : 's'} can be updated.`);

if (!interactive) {
	p.outro('Run ' + pc.bold('make update-plugins') + ' to select which to update.');
	process.exit(0);
}

// Interactive selection
const selected = await p.multiselect({
	message: 'Select packages to update',
	options: outdatedList.map((r) => ({
		value: r.name,
		label: r.name.split('/').pop(),
		hint: `${r.version} → ${newConstraint(r.latest)}${r.major ? ' (MAJOR)' : ''}`,
	})),
	required: false,
});

if (p.isCancel(selected) || selected.length === 0) {
	p.outro('No packages updated.');
	process.exit(0);
}

// Confirm major bumps individually
const updates = [];
for (const name of selected) {
	const r = outdatedList.find((o) => o.name === name);
	if (r.major) {
		const confirm = await p.confirm({
			message: `${r.name} is a MAJOR bump (${r.version} → ${newConstraint(r.latest)}). Proceed?`,
			initialValue: false,
		});
		if (p.isCancel(confirm) || !confirm) {
			p.log.warn(`Skipped ${r.name}`);
			continue;
		}
	}
	updates.push({ name: r.name, from: r.version, to: newConstraint(r.latest) });
}

if (updates.length === 0) {
	p.outro('No packages updated.');
	process.exit(0);
}

// Apply updates
let content = fs.readFileSync(PLUGINS_FILE, 'utf-8');
for (const u of updates) {
	const escaped = u.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	// Plugin registry entries (version: '^x.y')
	const pluginRegex = new RegExp(`(['"]${escaped}['"][^}]*version:\\s*['"])([^'"]+)(['"])`);
	if (pluginRegex.test(content)) {
		content = content.replace(pluginRegex, `$1${u.to}$3`);
	}

	// CORE_REQUIRE entries ('package': '^x.y')
	const coreRegex = new RegExp(`(['"]${escaped}['"]:\\s*['"])([^'"]+)(['"])`);
	if (coreRegex.test(content)) {
		content = content.replace(coreRegex, `$1${u.to}$3`);
	}

	p.log.success(`${u.name}  ${pc.dim(u.from)} → ${pc.green(u.to)}`);
}

fs.writeFileSync(PLUGINS_FILE, content);
p.outro(pc.green(`${updates.length} package${updates.length === 1 ? '' : 's'} updated.`));
