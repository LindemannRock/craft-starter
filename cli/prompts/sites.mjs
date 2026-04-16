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
 * Derive a short handle from a locale code.
 * 'en-US' → 'en', 'ar' → 'ar', 'zh-TW' → 'zh-tw'
 *
 */
function defaultHandle(language) {
	return language.toLowerCase().split('-')[0];
}

/**
 * Derive a short switcher label from a locale code.
 * Uses Intl.DisplayNames to get the native-script name, then takes the first word.
 *
 */
function defaultLabel(language) {
	try {
		const lang = language.split('-')[0];
		const display = new Intl.DisplayNames([lang], { type: 'language' });
		const name = display.of(lang) || lang;
		// Capitalize first letter, take first word only
		return name.split(/\s/)[0].slice(0, 10);
	} catch {
		return language.split('-')[0].toUpperCase();
	}
}

export async function promptSites(projectName) {
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
				return ALL_LANGUAGES
					.filter((l) => l.name.toLowerCase().includes(lower) || l.value.toLowerCase().includes(lower))
					.slice(0, 15);
			},
		}).catch((err) => {
			if (isPromptCancel(err)) cancel();
			throw err;
		});

		const suggestedHandle = defaultHandle(language);

		// Handle
		const handle = await p.text({
			message: `Site ${num} — Handle (used in URLs and code)`,
			placeholder: suggestedHandle,
			initialValue: suggestedHandle,
			validate: (v) => {
				if (!v) return 'Handle is required';
				if (!/^[a-z0-9-]+$/.test(v)) return 'Use lowercase letters, numbers, and hyphens only';
				if (v.length > 32) return 'Max 32 characters';
				if (usedHandles.has(v)) return `Handle "${v}" is already used by another site`;
			},
		});
		if (p.isCancel(handle)) cancel();

		// URL prefix — only URL-safe characters (no spaces, no control chars)
		const urlPrefix = await p.text({
			message: `Site ${num} — URL prefix`,
			placeholder: isFirst ? '(empty = root site)' : suggestedHandle,
			initialValue: isFirst ? '' : suggestedHandle,
			validate: (v) => {
				if (!v) return; // empty = root site, allowed
				if (!/^[a-z0-9-]+$/.test(v)) return 'Lowercase letters, numbers, and hyphens only';
				if (v.length > 32) return 'Max 32 characters';
			},
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
		sites.push({ handle, language, urlPrefix: urlPrefix || '', name: name || projectName, label: label || handle });
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
	} else if (rootSites.length > 1) {
		const kept = rootSites[0].handle;
		const changed = [];
		for (let i = 1; i < sites.length; i++) {
			if (sites[i].urlPrefix === '') {
				sites[i].urlPrefix = sites[i].handle;
				changed.push(sites[i].handle);
			}
		}
		p.log.warn(`Multiple root sites found. Auto-fixed: "${kept}" kept as root; ${changed.map((h) => `"${h}"`).join(', ')} get their handle as prefix.`);
		const ok = await p.confirm({ message: 'Continue with this fix?', initialValue: true });
		if (p.isCancel(ok) || !ok) cancel('Cancelled — re-run and set exactly one site with an empty URL prefix.');
	}

	return sites;
}
