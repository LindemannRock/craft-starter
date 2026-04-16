/**
 * .env file management.
 *
 * The source template lives at cli/templates/env.example. The CLI generates
 * a fresh .env at the project root from that template each time `make create`
 * runs, then applies the user's selected values using key-based replacement.
 *
 * Craft-owned settings (devMode, timezone, CP trigger, etc.) use the CRAFT_*
 * env var convention — Craft auto-reads these without needing code in
 * general.php. See cli/templates/env.example for the full list.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT, CLI_DIR } from '../paths.mjs';
import { generateSecurityKey, generateAppId, generateIpSalt, generateApiKey } from '../utils/crypto.mjs';

const ENV_SOURCE = path.join(CLI_DIR, 'templates', 'env.example');
const ENV_DEST = path.join(ROOT, '.env');

// The template's first comment block is an internal note for LindemannRock
// devs maintaining the starter — it should NOT appear in the generated .env.
const HEADER_BLOCK_REGEX = /^# -{3,}[\s\S]*?# -{3,}\n\n?/;

/**
 * Create a fresh .env from the template and populate it with user values.
 * Call this ONCE from the orchestrator — all env updates go here.
 *
 */
export function generateEnvFile({
	project,
	sites = [],
	servdCredentials,
	postmarkToken,
	smtpCredentials,
	useRedis,
	useCritical = false,
	selectedLr = [],
	selectedTp = [],
	selectedHosting = {},
}) {
	// Start from a clean copy of the source template, stripping the internal header
	let content = fs.readFileSync(ENV_SOURCE, 'utf-8').replace(HEADER_BLOCK_REGEX, '');

	const siteUrlBase = `https://${project.name}.ddev.site`;
	const siteName = project.description || project.name;

	const updates = {
		// Craft core — generated fresh each run
		CRAFT_APP_ID: generateAppId(),
		CRAFT_SECURITY_KEY: quoted(generateSecurityKey()),

		// Craft general config (auto-read from CRAFT_* prefix)
		CRAFT_TIMEZONE: project.timezone,
		CRAFT_CP_TRIGGER: project.cpTrigger || 'cms',

		// System
		SYSTEM_NAME: quoted(siteName),
		SYSTEM_SENDER_NAME: quoted(siteName),
		SYSTEM_EMAIL: project.systemEmail,
		SYSTEM_EMAIL_REPLY_TO: project.noReplyEmail || project.systemEmail,

		// Site URLs (dev only — staging/production are set via the hosting dashboard)
		PRIMARY_SITE_URL: siteUrlBase,

		// Vite dev server
		VITE_DEV_SERVER_PUBLIC: `${siteUrlBase}:3000/`,
		VITE_DEV_SERVER_INTERNAL: 'http://localhost:3000/',
		CRAFT_TEST_TO_EMAIL_ADDRESS: project.adminEmail,
	};

	// Per-site env vars — NOT added to updates because the site blocks are
	// dynamically appended later (after the template blocks are removed).
	// Values are written directly into the appended blocks instead.

	// Servd credentials — TODO-marked when user picked "scaffold placeholders"
	if (servdCredentials) {
		if (servdCredentials.placeholder) {
			updates.SERVD_PROJECT_SLUG = '# TODO: from Servd dashboard → Project Settings → Assets';
			updates.SERVD_SECURITY_KEY = '# TODO: from Servd dashboard → Project Settings → Assets';
			updates.SERVD_BASE_URL = '# TODO: https://{slug}.files.svdcdn.com once slug is set';
		} else {
			updates.SERVD_PROJECT_SLUG = servdCredentials.slug;
			updates.SERVD_SECURITY_KEY = servdCredentials.key;
			updates.SERVD_BASE_URL = `https://${servdCredentials.slug}.files.svdcdn.com`;
			if (servdCredentials.cdnUrl) {
				updates.SERVD_CDN_URL_PATTERN = `'${servdCredentials.cdnUrl}'`;
				updates.SERVD_IMAGE_TRANSFORM_URL_PATTERN = `'${servdCredentials.imageTransformUrl}'`;
			}
		}
	}

	// Postmark token
	if (postmarkToken) {
		updates.POSTMARK_TOKEN = postmarkToken;
	}

	// SMTP credentials (e.g. Servd SMTP or any other SMTP provider)
	if (smtpCredentials) {
		updates.SMTP_HOSTNAME = smtpCredentials.host;
		updates.SMTP_PORT = smtpCredentials.port;
		updates.SMTP_USERNAME = smtpCredentials.username;
		updates.SMTP_PASSWORD = quoted(smtpCredentials.password);
		updates.SMTP_USE_AUTH = smtpCredentials.useAuth ? 'true' : 'false';
	}

	// Apply all scalar updates
	for (const [key, value] of Object.entries(updates)) {
		content = setEnvKey(content, key, value);
	}

	// All selected plugins (LR + third-party) — used for salt generation and section cleanup
	const allPlugins = [...selectedLr, ...selectedTp];

	// Generate IP salts for selected LR plugins that need them
	for (const pl of allPlugins) {
		if (pl.ipSaltEnv) {
			content = setEnvKey(content, pl.ipSaltEnv, quoted(generateIpSalt()));
		}
	}

	// Generate Formie REST API keys if plugin is selected
	if (allPlugins.some((pl) => pl.handle === 'formie-rest-api')) {
		content = setEnvKey(content, 'FORMIE_API_KEY', quoted(generateApiKey('sk_live')));
		content = setEnvKey(content, 'FORMIE_API_KEY_LIMITED', quoted(generateApiKey('sk_limited')));
		content = setEnvKey(content, 'FORMIE_API_KEY_TEST', quoted(generateApiKey('sk_test')));
	}

	// Remove template site block — we dynamically append all site blocks below
	content = removeSection(content, '# English Site');
	content = removeSection(content, '# Arabic Site');

	// Append site env blocks with actual values
	const siteLines = [];
	for (const site of sites) {
		const h = site.handle.toUpperCase();
		const url = site.urlPrefix ? `${siteUrlBase}/${site.urlPrefix}/` : `${siteUrlBase}/`;
		siteLines.push(`# Site: ${site.handle}`);
		siteLines.push(`PRIMARY_SITE_URL_${h}=${url}`);
		siteLines.push(`PRIMARY_SITE_NAME_${h}=${quoted(site.name)}`);
		siteLines.push(`PRIMARY_SITE_LABEL_${h}=${site.label}`);
		siteLines.push('');
	}
	// Insert site blocks after PRIMARY_SITE_URL line
	content = content.replace(
		/(PRIMARY_SITE_URL=[^\n]*\n)/,
		`$1\n${siteLines.join('\n')}`,
	);
	if (!useRedis) {
		content = removeSection(content, '# Redis Cache');
	}

	if (!useCritical) {
		content = removeSection(content, '# Critical CSS');
	}

	// Remove plugin env sections when the plugin isn't selected.
	// Each section header in env.example must match the string passed here.
	const pluginEnvSections = [
		{ handle: 'campaign-manager', section: '# Campaign Manager' },
		{ handle: 'redirect-manager', section: '# Redirect Manager' },
		{ handle: 'search-manager', section: '# Search Manager' },
		{ handle: 'shortlink-manager', section: '# Shortlink Manager' },
		{ handle: 'smartlink-manager', section: '# Smartlink Manager' },
		{ handle: 'translation-manager', section: '# Translation Manager' },
		{ handle: 'formie-rest-api', section: '# Formie REST API' },
		{ handle: 'formie-sap-integration', section: '# Formie SAP Integration' },
		{ handle: 'cloudflare', section: '# Cloudflare' },
		{ handle: 'cloudflare', section: '# Cloudflare Turnstile' },
	];
	for (const { handle, section } of pluginEnvSections) {
		if (!allPlugins.some((pl) => pl.handle === handle)) {
			content = removeSection(content, section);
		}
	}
	if (!postmarkToken) {
		content = removeSection(content, '# Email - Postmark');
	}
	if (!smtpCredentials) {
		content = removeSection(content, '# Email - SMTP');
	}

	// Hosting-specific cleanup
	const hostingValue = selectedHosting.value || 'none';
	if (hostingValue !== 'servd') {
		content = removeSection(content, '# Servd Asset Storage');
	}
	if (hostingValue === 'craft-cloud') {
		// Cloud runs its own queue workers
		content = setEnvKey(content, 'CRAFT_RUN_QUEUE_AUTOMATICALLY', 'false');
	}

	// Collapse multiple blank lines left behind by removals
	content = content.replace(/\n{3,}/g, '\n\n');

	fs.writeFileSync(ENV_DEST, content);
}

/**
 * Remove a commented section from .env content — matches `# Section Name`
 * and all following `KEY=value` lines until the next blank line or new comment.
 *
 */
function removeSection(content, header) {
	const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	// Match the header line, optional description lines, and all KEY=value lines until blank
	const regex = new RegExp(`\\n${escaped}[^\\n]*\\n(?:#[^\\n]*\\n)*(?:[A-Z_]+=.*\\n)*`, 'g');
	return content.replace(regex, '\n');
}

/**
 * Replace (or append) a single key in .env content.
 * Matches the key at the start of a line and rewrites the entire value.
 * If the key doesn't exist, appends it to the end of the file.
 *
 */
export function setEnvKey(content, key, value) {
	const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`^${escaped}=.*$`, 'm');
	const line = `${key}=${value}`;

	if (regex.test(content)) {
		return content.replace(regex, line);
	}
	return content.endsWith('\n') ? content + line + '\n' : content + '\n' + line + '\n';
}

/**
 * Wrap a value in double quotes for .env files (use for values with spaces or special chars).
 *
 */
export function quoted(value) {
	return `"${String(value).replace(/"/g, '\\"')}"`;
}
