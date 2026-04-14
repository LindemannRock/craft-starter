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
import { cancel } from '../utils/cancel.mjs';
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

	// Timezone — autocomplete from all IANA timezones
	const allTimezones = Intl.supportedValuesOf('timeZone');
	const timezone = await search({
		message: 'Timezone (type to search)',
		source: async (input) => {
			if (!input) {
				return [
					{ value: 'UTC', name: 'UTC' },
					{ value: 'Europe/London', name: 'Europe/London' },
					{ value: 'Europe/Berlin', name: 'Europe/Berlin' },
					{ value: 'America/New_York', name: 'America/New_York' },
					{ value: 'America/Los_Angeles', name: 'America/Los_Angeles' },
					{ value: 'Asia/Dubai', name: 'Asia/Dubai' },
					{ value: 'Asia/Riyadh', name: 'Asia/Riyadh' },
					{ value: 'Asia/Tokyo', name: 'Asia/Tokyo' },
				];
			}
			const lower = input.toLowerCase();
			return allTimezones
				.filter((tz) => tz.toLowerCase().includes(lower))
				.slice(0, 15)
				.map((tz) => ({ value: tz, name: tz }));
		},
	}).catch(() => cancel());

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
	}).catch(() => cancel());

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
					message: 'Admin password',
					validate: (v) => {
						if (!v || v.length < 6) return 'Password must be at least 6 characters';
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
				}),
		},
		{ onCancel: () => cancel() },
	);

	return { ...base, timezone, language, ...credentials };
}
