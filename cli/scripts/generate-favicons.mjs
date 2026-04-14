/**
 * Favicon Generator
 *
 * Generates favicons from a single source SVG/PNG.
 * Shared images go to src/brand/favicons/ (one set for all sites).
 * Per-site web manifests go to src/brand/favicons/{handle}/ (name + direction).
 *
 * Usage: node generate-favicons.mjs
 *
 * Source: src/img/favicon.svg (or .png)
 * Output: src/brand/favicons/
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';

const SOURCE = path.join(ROOT, 'src/img/favicon.svg');
const OUTPUT_DIR = path.join(ROOT, 'src/brand/favicons');
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Read from .env or use defaults
const envPath = path.join(ROOT, '.env');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
const THEME_COLOR = (env.match(/^FAVICON_THEME_COLOR=(.*)$/m)?.[1] || '#1a1a1a').trim();
const BG_COLOR = (env.match(/^FAVICON_BG_COLOR=(.*)$/m)?.[1] || '#ffffff').trim();

const SIZES = {
	'favicon-16x16.png': 16,
	'favicon-32x32.png': 32,
	'favicon-48x48.png': 48,
	'apple-touch-icon.png': 180,
	'android-chrome-192x192.png': 192,
	'android-chrome-512x512.png': 512,
	'mstile-150x150.png': 150,
};

/**
 * Read .env and extract site handles + names.
 *
 */
function discoverSites() {
	if (!env) {
		console.error('No .env file found. Run make create first.');
		process.exit(1);
	}
	const sites = [];
	const nameRegex = /^PRIMARY_SITE_NAME_([A-Z0-9-]+)=(.*)$/gm;
	let match;

	while ((match = nameRegex.exec(env)) !== null) {
		const handle = match[1].toLowerCase();
		const name = match[2].replace(/^"|"$/g, '').trim() || handle;
		sites.push({ handle, name });
	}

	if (sites.length === 0) {
		console.error('No sites found in .env (expected PRIMARY_SITE_NAME_* vars).');
		process.exit(1);
	}

	return sites;
}

async function generateFavicons() {
	if (!fs.existsSync(SOURCE)) {
		console.log('\n  No favicon source found.\n');
		console.log('  Add your favicon to src/img/favicon.svg then run make favicons again.\n');
		process.exit(0);
	}

	const sites = discoverSites();
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });

	console.log('Generating shared favicon images...\n');

	// Shared images — one set for all sites
	for (const [filename, size] of Object.entries(SIZES)) {
		await sharp(SOURCE).resize(size, size).png().toFile(path.join(OUTPUT_DIR, filename));
		console.log(`  ${filename}`);
	}

	// ICO (48x48)
	await sharp(SOURCE).resize(48, 48).png().toFile(path.join(OUTPUT_DIR, 'favicon.ico'));
	console.log('  favicon.ico');

	// SVG copy
	if (SOURCE.endsWith('.svg')) {
		fs.copyFileSync(SOURCE, path.join(OUTPUT_DIR, 'favicon.svg'));
		console.log('  favicon.svg');
	}

	// Safari pinned tab SVG (shared — just a copy of the source)
	if (SOURCE.endsWith('.svg')) {
		fs.copyFileSync(SOURCE, path.join(OUTPUT_DIR, 'safari-pinned-tab.svg'));
		console.log('  safari-pinned-tab.svg');
	}

	// Per-site web manifests (name + direction vary)
	console.log('\nGenerating per-site manifests...\n');

	for (const site of sites) {
		const siteDir = path.join(OUTPUT_DIR, site.handle);
		fs.mkdirSync(siteDir, { recursive: true });

		const dir = RTL_LANGUAGES.includes(site.handle) ? 'rtl' : 'ltr';

		const manifest = {
			name: site.name,
			short_name: site.name,
			dir,
			lang: site.handle,
			icons: [
				{ src: '../android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
				{ src: '../android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
			],
			theme_color: THEME_COLOR,
			background_color: BG_COLOR,
			display: 'standalone',
		};

		fs.writeFileSync(path.join(siteDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
		console.log(`  ${site.handle}/site.webmanifest`);
	}

	console.log('\nFavicons generated successfully.');
}

generateFavicons().catch(console.error);
