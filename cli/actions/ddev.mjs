/**
 * Updates .ddev/config.yaml with the project name and timezone.
 * Also toggles the Chromium apt packages (and config.m1.yaml sidecar) based on
 * whether critical CSS is enabled — idempotent in both directions so re-running
 * `make create` with a different choice cleanly adds or removes them.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ROOT } from '../paths.mjs';

// Packages needed by headless Chromium (via rollup-plugin-critical → puppeteer).
// Order-preserving list so the committed config.yaml's order is respected.
const CHROMIUM_PACKAGES = [
	'libasound2', 'libatk1.0-0', 'libcairo2', 'libgdk-pixbuf-xlib-2.0-0', 'libgtk-3-0',
	'libnspr4', 'libpango-1.0-0', 'libpangocairo-1.0-0', 'libx11-xcb1', 'libxcomposite1',
	'libxcursor1', 'libxdamage1', 'libxfixes3', 'libxi6', 'libxrandr2', 'libxrender1',
	'libxss1', 'libxtst6', 'fonts-liberation', 'libappindicator3-1', 'libnss3', 'xdg-utils',
];
const CHROMIUM_SET = new Set(CHROMIUM_PACKAGES);

export function updateDdevConfig({ name, timezone }, { useCritical = true } = {}) {
	const ddevPath = path.join(ROOT, '.ddev', 'config.yaml');
	let ddevConfig = fs.readFileSync(ddevPath, 'utf-8');
	ddevConfig = ddevConfig.replace(/^name: .*/m, `name: ${name}`);
	ddevConfig = ddevConfig.replace(/^timezone: .*/m, `timezone: ${timezone}`);
	ddevConfig = updateChromiumPackages(ddevConfig, useCritical);
	fs.writeFileSync(ddevPath, ddevConfig);

	// config.m1.yaml is Apple-Silicon Chromium wiring — delete when declined,
	// restore from git when re-enabled (covers the flip-flop case).
	const m1Path = path.join(ROOT, '.ddev', 'config.m1.yaml');
	if (useCritical) {
		if (!fs.existsSync(m1Path)) restoreFromGit('.ddev/config.m1.yaml');
	} else if (fs.existsSync(m1Path)) {
		fs.rmSync(m1Path);
	}
}

function updateChromiumPackages(ddevConfig, useCritical) {
	return ddevConfig.replace(/^webimage_extra_packages: \[([^\]]*)\]/m, (_match, inner) => {
		const current = inner.split(',').map((pkg) => pkg.trim()).filter(Boolean);
		const base = current.filter((pkg) => !CHROMIUM_SET.has(pkg));
		const final = useCritical ? [...base, ...CHROMIUM_PACKAGES] : base;
		return `webimage_extra_packages: [${final.join(', ')}]`;
	});
}

function restoreFromGit(relPath) {
	try {
		execSync(`git checkout HEAD -- ${relPath}`, { cwd: ROOT, stdio: 'ignore' });
	} catch {
		// silently ignore — git may not be available, file will be re-created on next nuke
	}
}
