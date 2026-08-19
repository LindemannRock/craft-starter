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
import { ROOT } from '../paths.mjs';
import { DEFAULT_DATABASE } from '../config/databases.mjs';
import { craftProjectPath, resolveCraftProfile } from '../config/craft-profiles.mjs';
import { generateSecurityKey, generateAppId, generateIpSalt, generateApiKey } from '../utils/crypto.mjs';

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
	useRedisCache,
	useRedisSession = false,
	useCritical = false,
	selectedLr = [],
	selectedTp = [],
	selectedHosting = {},
	translationCategory = 'site',
	database = DEFAULT_DATABASE,
	craftProfile,
	root = ROOT,
}) {
	const profile = resolveCraftProfile(craftProfile);
	const envSource = craftProjectPath(root, 'envTemplate', profile);
	const envDest = path.join(root, '.env');
	// Start from a clean copy of the source template, stripping the internal header.
	// Normalize CRLF → LF defensively so a template accidentally saved with Windows
	// line endings doesn't leave stray `\r` chars that some .env parsers mishandle.
	let content = fs.readFileSync(envSource, 'utf-8').replace(/\r\n/g, '\n').replace(HEADER_BLOCK_REGEX, '');

	const siteUrlBase = `https://${project.name}.ddev.site`;
	const siteName = project.description || project.name;
	const applicationEnv = profile.env.application;
	const mailEnv = profile.env.mail;

	const updates = {};
	const setUpdate = (key, value) => {
		if (key) updates[key] = value;
	};

	// Application identity differs between the Craft 5 Yii application and
	// Craft 6's Laravel host, but both are described by the active profile.
	setUpdate(applicationEnv.id, generateAppId());
	setUpdate(applicationEnv.key, serializeEnvValue(`${applicationEnv.keyPrefix || ''}${generateSecurityKey()}`));
	setUpdate(applicationEnv.name, serializeEnvValue(siteName));
	setUpdate(applicationEnv.environment, 'local');
	setUpdate(applicationEnv.debug, 'true');
	setUpdate(applicationEnv.url, siteUrlBase);
	setUpdate(applicationEnv.locale, sites[0]?.language || project.language);

	// Craft general config remains CRAFT_* based in both supported profiles.
	setUpdate('CRAFT_TIMEZONE', project.timezone);
	setUpdate('CRAFT_CP_TRIGGER', project.cpTrigger || 'cms');

	// Project Config and template variables.
	setUpdate('SYSTEM_NAME', serializeEnvValue(siteName));
	setUpdate(mailEnv.fromName, serializeEnvValue(siteName));
	setUpdate(mailEnv.fromAddress, serializeEnvValue(project.systemEmail));
	setUpdate(mailEnv.replyTo, serializeEnvValue(project.noReplyEmail || project.systemEmail));

	// Site URLs (dev only — staging/production are set via the hosting dashboard).
	setUpdate('PRIMARY_SITE_URL', siteUrlBase);
	setUpdate('PRIMARY_SITE_LANGUAGE', sites[0]?.language || project.language);
	setUpdate('PRIMARY_TRANSLATION_CATEGORY', translationCategory);

	// Optional Craft 5 Vite bridge values are only written when the selected
	// profile's template contains them.
	if (/^VITE_DEV_SERVER_PUBLIC=/m.test(content)) {
		setUpdate('VITE_DEV_SERVER_PUBLIC', `${siteUrlBase}:3000/`);
		setUpdate('VITE_DEV_SERVER_INTERNAL', 'http://localhost:3000/');
	}
	setUpdate('CRAFT_TEST_TO_EMAIL_ADDRESS', serializeEnvValue(project.adminEmail));
	updates[profile.env.database.driver] = database.craftDriver;
	updates[profile.env.database.port] = database.craftPort;
	updates[profile.env.database.schema] = database.craftSchema;

	// Per-site env vars — NOT added to updates because the site blocks are
	// dynamically appended later (after the template blocks are removed).
	// Values are written directly into the appended blocks instead.

	// Servd credentials — TODO-marked when user picked "scaffold placeholders"
	if (servdCredentials) {
		if (servdCredentials.placeholder) {
			updates.SERVD_PROJECT_SLUG = '# TODO: from Servd dashboard → Project Settings → Assets';
			updates.SERVD_BASE_URL = '# TODO: https://{slug}.files.svdcdn.com once slug is set';
		} else {
			updates.SERVD_PROJECT_SLUG = serializeEnvValue(servdCredentials.slug);
			updates.SERVD_SECURITY_KEY = serializeEnvValue(servdCredentials.key);
			updates.SERVD_BASE_URL = `https://${servdCredentials.slug}.files.svdcdn.com`;
			if (servdCredentials.cdnUrl) {
				updates.SERVD_CDN_URL_PATTERN = serializeEnvValue(servdCredentials.cdnUrl);
				updates.SERVD_IMAGE_TRANSFORM_URL_PATTERN = serializeEnvValue(servdCredentials.imageTransformUrl);
			}
		}
	}

	// Postmark token
	if (postmarkToken) {
		updates.POSTMARK_TOKEN = serializeEnvValue(postmarkToken);
	}

	// SMTP credentials (e.g. Servd SMTP or any other SMTP provider)
	if (smtpCredentials) {
		setUpdate(mailEnv.mailer, 'smtp');
		setUpdate(mailEnv.host, serializeEnvValue(smtpCredentials.host));
		setUpdate(mailEnv.port, smtpCredentials.port);
		setUpdate(mailEnv.username, serializeEnvValue(smtpCredentials.username || ''));
		setUpdate(mailEnv.password, serializeEnvValue(smtpCredentials.password || ''));
		setUpdate(mailEnv.useAuth, smtpCredentials.useAuth ? 'true' : 'false');
		setUpdate(mailEnv.scheme, serializeEnvValue(smtpCredentials.encryption || ''));
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
			content = setEnvKey(content, pl.ipSaltEnv, serializeEnvValue(generateIpSalt()));
		}
	}

	// Generate Formie REST API keys if plugin is selected
	if (allPlugins.some((pl) => pl.handle === 'formie-rest-api')) {
		content = setEnvKey(content, 'FORMIE_API_KEY', serializeEnvValue(generateApiKey('sk_live')));
		content = setEnvKey(content, 'FORMIE_API_KEY_LIMITED', serializeEnvValue(generateApiKey('sk_limited')));
		content = setEnvKey(content, 'FORMIE_API_KEY_TEST', serializeEnvValue(generateApiKey('sk_test')));
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
		siteLines.push(`PRIMARY_SITE_NAME_${h}=${serializeEnvValue(site.name)}`);
		siteLines.push(`PRIMARY_SITE_LABEL_${h}=${serializeEnvValue(site.label)}`);
		siteLines.push('');
	}
	// Insert site blocks after PRIMARY_SITE_URL line.
	// Function replacer because siteLines contain user-entered values (name, label,
	// urlPrefix) that could contain `$` chars which `String.replace` would otherwise
	// interpret as replacement patterns (`$&`, `$1`, etc.).
	const siteBlock = siteLines.join('\n');
	content = content.replace(/(PRIMARY_SITE_URL=[^\n]*\n)/, (_match, primaryLine) => `${primaryLine}\n${siteBlock}`);
	if (!useRedisCache) {
		content = removeSection(content, '# Redis');
	} else if (useRedisSession) {
		// Append session DB index after the Redis block
		content = content.replace(/(REDIS_DATABASE=\d+)/, (_match, line) => `${line}\nREDIS_SESSION_DB=1`);
	}

	if (!useCritical) {
		content = removeSection(content, '# Critical CSS');
	}

	// Remove plugin env sections when the plugin isn't selected.
	// Each section header in env.example must match the string passed here.
	const pluginEnvSections = [
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

	// Collapse multiple blank lines left behind by removals
	content = content.replace(/\n{3,}/g, '\n\n');

	fs.writeFileSync(envDest, content);
}

/**
 * Remove a commented section from .env content — matches `# Section Name`
 * and all following lines until the next blank line (section boundary).
 *
 * Hard-stops at the first blank line so removing one section can never
 * accidentally eat the next one if a contributor forgets a blank separator.
 *
 */
export function removeSection(content, header) {
	const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	// \n<header>[stuff not starting with blank]<stuff until blank>
	// Each content line must have at least one non-newline char (prevents blank line consumption).
	const regex = new RegExp(`\\n${escaped}[^\\n]*\\n(?:[^\\n]+\\n)*`, 'g');
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
		// Function replacer so `$`-containing values (Postmark tokens, Servd keys
		// with `$`, site names like "Acme $1") aren't interpreted as replacement
		// patterns like `$&` / `$1`.
		return content.replace(regex, () => line);
	}
	// Warn on append — if the key isn't in env.example, it's usually a typo
	// (e.g. SERVD_PROJECT_SLOG). The real key keeps its template default and
	// the typo silently sits at the bottom of .env forever. Loud warning
	// surfaces this during development.
	console.warn(`[env] key "${key}" not found in template — appending to end. If this is unexpected, check for typos.`);
	return content.endsWith('\n') ? content + line + '\n' : content + '\n' + line + '\n';
}

/**
 * Wrap a value in double quotes for .env files (use for values with spaces or special chars).
 *
 */
export function serializeEnvValue(value) {
	const escaped = String(value)
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\$/g, '\\$')
		.replace(/\r/g, '\\r')
		.replace(/\n/g, '\\n');
	return `"${escaped}"`;
}

export const quoted = serializeEnvValue;
