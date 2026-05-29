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
import { LR_PLUGINS, THIRD_PARTY_PLUGINS, CORE_REQUIRE, CORE_REQUIRE_DEV, REDIS_PACKAGE, HOSTING_OPTIONS } from '../config/plugins.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PLUGINS_FILE = path.join(__dirname, '../config/plugins.mjs');
const COMPOSER_FILE = path.join(ROOT, 'composer.json');

const allPackages = [
	...Object.entries(CORE_REQUIRE).map(([name, version]) => ({ name, version, source: 'core' })),
	...Object.entries(CORE_REQUIRE_DEV).map(([name, version]) => ({ name, version, source: 'core-dev' })),
	{ name: REDIS_PACKAGE.name, version: REDIS_PACKAGE.version, source: 'core-optional' },
	...LR_PLUGINS.map((pl) => ({ name: pl.value, version: pl.version, source: 'lr' })),
	...THIRD_PARTY_PLUGINS.map((pl) => ({ name: pl.value, version: pl.version, source: '3rd-party' })),
	...HOSTING_OPTIONS.flatMap((h) => h.packages.map((pk) => ({ name: pk.name, version: pk.version, source: `hosting:${h.value}` }))),
];

function normalizeVersion(version) {
	return version.replace(/^v/, '');
}

function packagistUrl(packageName) {
	return `https://packagist.org/packages/${packageName}`;
}

function releaseUrl(sourceUrl) {
	if (!sourceUrl) return null;
	const cleanUrl = sourceUrl.replace(/\.git$/, '');
	if (/^https:\/\/(www\.)?github\.com\//.test(cleanUrl) || /^https:\/\/gitlab\.com\//.test(cleanUrl)) {
		return `${cleanUrl}/releases`;
	}
	return cleanUrl;
}

async function getPackageInfo(packageName) {
	try {
		const res = await fetch(`https://repo.packagist.org/p2/${packageName}.json`, { signal: AbortSignal.timeout(15_000) });
		if (!res.ok) return null;
		const data = await res.json();
		const versions = data.packages?.[packageName] || [];
		const stable = versions
			// Case-insensitive prerelease filter so `rc1` / `Alpha` / `BETA` are caught too.
			// Matches any hyphen-prefixed suffix (the conventional prerelease marker).
			.filter((v) => !/-(dev|alpha|beta|rc|pre)/i.test(v.version))
			.sort((a, b) => normalizeVersion(b.version).localeCompare(normalizeVersion(a.version), undefined, { numeric: true }));
		const latest = stable[0];
		if (!latest) return null;
		const sourceUrl = latest.source?.url || latest.homepage || null;
		return {
			latest: normalizeVersion(latest.version),
			packagistUrl: packagistUrl(packageName),
			releaseUrl: releaseUrl(sourceUrl),
		};
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
	const [cMajor = 0, cMinor = 0, cPatch = 0] = parsed;
	const [lMajor = 0, lMinor = 0, lPatch = 0] = latest.split('.').map(Number);
	if (lMajor !== cMajor) return lMajor > cMajor;
	if (lMinor !== cMinor) return lMinor > cMinor;
	return lPatch > cPatch;
}

function isMajorBump(constraint, latest) {
	const parsed = parseConstraint(constraint);
	if (!parsed) return false;
	const [cMajor] = parsed;
	const [lMajor] = latest.split('.').map(Number);
	return lMajor > cMajor;
}

function newConstraint(latest) {
	// Pin the floor to the latest version so security/bug-fix patches are
	// guaranteed. Caret already allows newer compatible versions above.
	// Examples: 5.6.3 → ^5.6.3, 3.0.20 → ^3.0.20.
	const parts = latest.split('.');
	const major = parts[0] ?? '0';
	const minor = parts[1] ?? '0';
	const patch = parts[2] ?? '0';
	return `^${major}.${minor}.${patch}`;
}

const interactive = process.argv.includes('--update');

p.intro(pc.bgCyan(pc.black(' Plugin Version Check ')));

const s = p.spinner();
s.start('Fetching versions from Packagist');

const results = [];
for (const pkg of allPackages) {
	const info = await getPackageInfo(pkg.name);
	results.push({ ...pkg, ...info });
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
		if (major) {
			p.log.warn(`Review major changes: ${r.releaseUrl || r.packagistUrl}`);
			if (r.releaseUrl && r.releaseUrl !== r.packagistUrl) {
				p.log.info(`Package: ${r.packagistUrl}`);
			}
		}
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

const majorUpdates = outdatedList.filter((r) => r.major);
if (majorUpdates.length > 0) {
	p.log.warn(`${majorUpdates.length} major update${majorUpdates.length === 1 ? '' : 's'} require review:`);
	for (const r of majorUpdates) {
		p.log.info(`${r.name}  ${pc.dim(r.version)} → ${pc.red(newConstraint(r.latest))}`);
		p.log.info(`Review: ${r.releaseUrl || r.packagistUrl}`);
	}
}

// In check-only mode, ask if the user wants to proceed with the update right
// now (reuses the already-fetched data — no second Packagist round-trip).
// Direct callers can pass --update to skip the prompt and go straight to select.
if (!interactive) {
	const proceed = await p.confirm({
		message: 'Update now?',
		initialValue: false,
	});
	if (p.isCancel(proceed) || !proceed) {
		p.outro('Run ' + pc.bold('make registry') + ' → ' + pc.cyan('Update versions') + ' to select which to update later.');
		process.exit(0);
	}
}

// Interactive selection
const selected = await p.multiselect({
	message: 'Select packages to update',
	options: outdatedList.map((r) => ({
		value: r.name,
		label: r.name,
		hint: `${r.version} → ${newConstraint(r.latest)}${r.major ? ` (${pc.red('MAJOR')})` : ''}`,
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
		p.log.warn(`Review before updating: ${r.releaseUrl || r.packagistUrl}`);
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

// Apply updates to plugins.mjs
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

// Sync core package versions into the committed composer.json so `make nuke`
// restores the up-to-date baseline. Only the keys present in composer.json
// (require + require-dev) get touched — plugin selections are written by the
// CLI from the registry during `make create`, not stored here.
if (fs.existsSync(COMPOSER_FILE)) {
	const composer = JSON.parse(fs.readFileSync(COMPOSER_FILE, 'utf-8'));
	let composerChanged = false;
	for (const u of updates) {
		if (composer.require?.[u.name]) {
			composer.require[u.name] = u.to;
			composerChanged = true;
		}
		if (composer['require-dev']?.[u.name]) {
			composer['require-dev'][u.name] = u.to;
			composerChanged = true;
		}
	}
	if (composerChanged) {
		fs.writeFileSync(COMPOSER_FILE, JSON.stringify(composer, null, '\t') + '\n');
		p.log.info('composer.json synced with new core versions');
	}
}

p.outro(pc.green(`${updates.length} package${updates.length === 1 ? '' : 's'} updated.`));
