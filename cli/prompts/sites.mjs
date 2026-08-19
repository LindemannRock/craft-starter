/**
 * Multi-site prompts.
 * Asks how many sites, then collects handle, language, URL prefix, name, and
 * switcher label for each. Returns an array of site objects.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import search from '@inquirer/search';
import { COMMON_LANGUAGES, ALL_LANGUAGES } from '../config/languages.mjs';
import { cancel, isPromptCancel } from '../utils/cancel.mjs';

/**
 * Derive a short code-safe handle from a locale code.
 * 'en-US' → 'en', 'ar' → 'ar', 'zh-TW' → 'zh'
 *
 */
function defaultHandle(language) {
	return language.toLowerCase().split('-')[0];
}

export function isValidSiteHandle(value) {
	return /^[a-z][a-z0-9_]*$/.test(value);
}

export function urlPrefixFromHandle(handle) {
	return handle.replace(/_/g, '-');
}

export function normalizeUrlPrefix(value) {
	return String(value || '')
		.replace(/^\/+|\/+$/g, '')
		.toLowerCase();
}

export function validateSiteUrlPrefix(value, { usedPrefixes = new Set(), cpTrigger = 'cms' } = {}) {
	const normalized = normalizeUrlPrefix(value);
	if (normalized && !/^[a-z0-9-]+$/.test(normalized)) return 'Lowercase letters, numbers, and hyphens only';
	if (normalized.length > 32) return 'Max 32 characters';
	if (normalized === normalizeUrlPrefix(cpTrigger))
		return `Prefix "${normalized}" conflicts with the control-panel trigger`;
	if (usedPrefixes.has(normalized)) {
		return normalized
			? `Prefix "${normalized}" is already used by another site`
			: 'A root site with an empty prefix already exists';
	}
}

export function getSiteUrlConflicts(sites, cpTrigger = 'cms') {
	const seen = new Set();
	const conflicts = [];
	for (const site of sites) {
		const prefix = normalizeUrlPrefix(site.urlPrefix);
		if (prefix === normalizeUrlPrefix(cpTrigger)) conflicts.push(`Site "${site.handle}" conflicts with /${cpTrigger}`);
		if (seen.has(prefix)) conflicts.push(`Site "${site.handle}" duplicates ${prefix ? `/${prefix}/` : 'the root URL'}`);
		seen.add(prefix);
	}
	if (![...seen].includes('')) conflicts.push('Exactly one site must use the root URL');
	return conflicts;
}

/**
 * Derive a short switcher label from a locale code.
 * Uses native-script language names and preserves the region code when present.
 *
 */
export function defaultLabel(language) {
	try {
		const [lang, region] = language.split('-');
		const display = new Intl.DisplayNames([lang], { type: 'language' });
		const name = display.of(lang) || lang;
		const label = region ? `${name} (${region.toUpperCase()})` : name;
		return capitalizeFirst(label).slice(0, 20);
	} catch {
		return language.split('-')[0].toUpperCase();
	}
}

function capitalizeFirst(value) {
	return value ? value.charAt(0).toLocaleUpperCase() + value.slice(1) : value;
}

export async function promptSites(projectName, { cpTrigger = 'cms' } = {}) {
	const count = await p.select({
		message: 'How many sites?',
		options: [
			{ value: 1, label: '1', hint: 'Single language' },
			{ value: 2, label: '2', hint: 'e.g. English + Arabic' },
			{ value: 3, label: '3' },
			{ value: 4, label: '4' },
			{ value: 5, label: '5' },
		],
		initialValue: 1,
	});
	if (p.isCancel(count)) cancel();

	const sites = [];
	const usedHandles = new Set();
	const usedPrefixes = new Set();

	for (let i = 0; i < count; i++) {
		const num = i + 1;
		const isFirst = i === 0;

		p.log.step(`Site ${num} of ${count}`);

		// Language
		const language = await search({
			message: `Site ${num} — Language`,
			source: async (input) => {
				if (!input) return COMMON_LANGUAGES.slice(0, 10);
				const lower = input.toLowerCase();
				return ALL_LANGUAGES.filter(
					(l) => l.name.toLowerCase().includes(lower) || l.value.toLowerCase().includes(lower),
				).slice(0, 15);
			},
		}).catch((err) => {
			if (isPromptCancel(err)) cancel();
			throw err;
		});

		const suggestedHandle = defaultHandle(language);

		// Handle
		const handle = await p.text({
			message: `Site ${num} — Handle (used in code/env vars)`,
			placeholder: suggestedHandle,
			initialValue: suggestedHandle,
			validate: (v) => {
				if (!v) return 'Handle is required';
				if (!isValidSiteHandle(v))
					return 'Start with a lowercase letter; use lowercase letters, numbers, and underscores only';
				if (v.length > 32) return 'Max 32 characters';
				if (usedHandles.has(v)) return `Handle "${v}" is already used by another site`;
			},
		});
		if (p.isCancel(handle)) cancel();

		// URL prefix — only URL-safe characters (no spaces, no control chars)
		const urlPrefix = await p.text({
			message: `Site ${num} — URL prefix`,
			placeholder: isFirst ? '(empty = root site)' : urlPrefixFromHandle(handle),
			initialValue: isFirst ? '' : urlPrefixFromHandle(handle),
			validate: (v) => validateSiteUrlPrefix(v, { usedPrefixes, cpTrigger }),
		});
		if (p.isCancel(urlPrefix)) cancel();

		// Site name — reject control chars that would break .env or YAML
		const name = await p.text({
			message: `Site ${num} — Site name`,
			placeholder: projectName || 'My Project',
			initialValue: projectName || '',
			validate: (v) => {
				if (!v) return;
				if (/[\r\n]/.test(v)) return 'No newlines';
				if (v.length > 80) return 'Max 80 characters';
			},
		});
		if (p.isCancel(name)) cancel();

		// Switcher label — short text, no newlines, no `#` / `"` (breaks unquoted .env)
		const label = await p.text({
			message: `Site ${num} — Switcher label`,
			placeholder: defaultLabel(language),
			initialValue: defaultLabel(language),
			validate: (v) => {
				if (!v) return;
				if (/[\r\n"#]/.test(v)) return 'No newlines, quotes, or # characters';
				if (v.length > 20) return 'Max 20 characters';
			},
		});
		if (p.isCancel(label)) cancel();

		usedHandles.add(handle);
		const normalizedPrefix = normalizeUrlPrefix(urlPrefix);
		usedPrefixes.add(normalizedPrefix);
		sites.push({ handle, language, urlPrefix: normalizedPrefix, name: name || projectName, label: label || handle });
	}

	// Validate: exactly one root site (empty URL prefix). When the user picked
	// multiple roots or none, auto-fix and surface the change via a confirmation
	// prompt so they don't miss the warning in a scroll-heavy terminal.
	const rootSites = sites.filter((s) => s.urlPrefix === '');
	if (rootSites.length === 0) {
		sites[0].urlPrefix = '';
		p.log.warn(`No root site (empty URL prefix). Auto-fixed: "${sites[0].handle}" is now the root site.`);
		const ok = await p.confirm({ message: 'Continue with this fix?', initialValue: true });
		if (p.isCancel(ok) || !ok) cancel('Cancelled — re-run and set one site with an empty URL prefix.');
	}

	return sites;
}
