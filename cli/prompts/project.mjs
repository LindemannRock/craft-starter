/**
 * Project-level prompts: project name, site name, timezone, language,
 * admin credentials, system email.
 *
 * Timezone and language use @inquirer/search for autocomplete since
 * @clack/prompts doesn't have a native searchable select.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import search from '@inquirer/search';
import { COMMON_LANGUAGES, ALL_LANGUAGES } from '../config/languages.mjs';
import { cancel, isPromptCancel } from '../utils/cancel.mjs';

/**
 * Convert raw @inquirer errors into the right behavior: real cancels exit
 * cleanly, anything else re-throws so setup.mjs' main() handler surfaces it.
 */
function handlePromptError(err) {
	if (isPromptCancel(err)) cancel();
	throw err;
}

/**
 * Format a timezone's UTC offset as a human-readable string, e.g. "UTC+4" or "UTC-5:30".
 * Uses Intl.DateTimeFormat to get the real offset for a given date (handles DST).
 */
function getUtcOffset(tz, date) {
	try {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			timeZoneName: 'shortOffset',
		}).formatToParts(date);
		const offsetPart = parts.find((p) => p.type === 'timeZoneName');
		// "GMT+4" → "UTC+4", "GMT" → "UTC+0"
		const raw = offsetPart?.value || 'GMT';
		return raw === 'GMT' ? 'UTC+0' : raw.replace('GMT', 'UTC');
	} catch {
		return 'UTC';
	}
}
import { isValidEmail } from '../utils/validate.mjs';

export async function promptProject() {
	// Part 1 — basic project details
	const base = await p.group(
		{
			name: () =>
				p.text({
					message: 'Project name (DDEV + package name)',
					placeholder: 'my-project',
					validate: (v) => {
						if (!v) return 'Project name is required';
						if (v.length > 63) return 'Max 63 characters (DNS limit)';
						if (!/^[a-z0-9-]+$/.test(v)) return 'Use lowercase letters, numbers, and hyphens only';
					},
				}),
			description: () =>
				p.text({
					message: 'Site name',
					placeholder: 'Client Name',
				}),
		},
		{ onCancel: () => cancel() },
	);

	// Timezone — autocomplete from all IANA timezones with UTC offset display.
	// Supports searching by zone name ("dubai"), region ("asia"), offset ("+4", "UTC+4"),
	// or city-style partial matches ("new_y" → America/New_York).
	const allTimezones = Intl.supportedValuesOf('timeZone');

	// Pre-compute offset labels once (they don't change during the prompt session).
	const now = new Date();
	const tzEntries = allTimezones.map((tz) => {
		const offset = getUtcOffset(tz, now);
		const label = `${tz} (${offset})`;
		// Searchable text: zone name + offset string (e.g. "America/New_York UTC-5 -5")
		const searchText = `${tz} ${offset} ${offset.replace('UTC', '')}`.toLowerCase();
		return { value: tz, name: label, searchText };
	});

	const popularTimezones = [
		'UTC', 'Europe/London', 'Europe/Berlin', 'America/New_York',
		'America/Los_Angeles', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Tokyo',
		'Asia/Shanghai', 'Australia/Sydney',
	];
	const popularEntries = popularTimezones
		.map((tz) => tzEntries.find((e) => e.value === tz))
		.filter(Boolean);

	const timezone = await search({
		message: 'Timezone (type to search — name, region, or offset like +4)',
		source: async (input) => {
			if (!input) return popularEntries;
			const lower = input.toLowerCase();
			return tzEntries
				.filter((e) => e.searchText.includes(lower))
				.slice(0, 30);
		},
	}).catch(handlePromptError);

	// Language — autocomplete (press Enter for English)
	const language = await search({
		message: 'Default site/CP language (press Enter for English)',
		source: async (input) => {
			if (!input) return COMMON_LANGUAGES.slice(0, 10);
			const lower = input.toLowerCase();
			return ALL_LANGUAGES
				.filter((l) => l.name.toLowerCase().includes(lower) || l.value.toLowerCase().includes(lower))
				.slice(0, 15);
		},
	}).catch(handlePromptError);

	// Part 2 — credentials
	const credentials = await p.group(
		{
			weekStartDay: () =>
				p.select({
					message: 'Week starts on',
					options: [
						{ value: 1, label: 'Monday', hint: 'Europe, most of the world' },
						{ value: 0, label: 'Sunday', hint: 'Middle East, US, Canada' },
					],
					initialValue: 1,
				}),
			cpTrigger: () =>
				p.text({
					message: 'CP trigger (URL segment for the control panel)',
					placeholder: 'cms',
					initialValue: 'cms',
					validate: (v) => {
						if (!v) return 'CP trigger is required';
						if (!/^[a-z0-9-]+$/.test(v)) return 'Use lowercase letters, numbers, and hyphens only';
					},
				}),
			adminEmail: () =>
				p.text({
					message: 'Admin email (CP login)',
					placeholder: 'hello@lindemannrock.com',
					defaultValue: 'hello@lindemannrock.com',
					validate: (v) => {
						const val = v || 'hello@lindemannrock.com';
						if (!isValidEmail(val)) return 'Enter a valid email address';
					},
				}),
			adminPassword: () =>
				p.password({
					message: 'Admin password (minimum 10 chars — use a passphrase)',
					validate: (v) => {
						if (!v || v.length < 10) return 'Password must be at least 10 characters';
					},
				}),
			systemEmail: () =>
				p.text({
					message: 'System email (from address for outgoing mail)',
					placeholder: 'info@example.com',
					defaultValue: 'info@example.com',
					validate: (v) => {
						const val = v || 'info@example.com';
						if (!isValidEmail(val)) return 'Enter a valid email address';
					},
				}),
			noReplyEmail: () =>
				p.text({
					message: 'No-reply email (optional — reply-to address)',
					placeholder: 'no-reply@example.com',
					validate: (v) => {
						if (!v) return; // empty = use system email as reply-to (handled downstream)
						if (!isValidEmail(v)) return 'Enter a valid email address or leave empty';
					},
				}),
		},
		{ onCancel: () => cancel() },
	);

	return { ...base, timezone, language, ...credentials };
}
