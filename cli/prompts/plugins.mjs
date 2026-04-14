/**
 * Plugin and hosting prompts.
 * Returns the resolved plugin objects (not just the composer package names)
 * so downstream actions can access handles, versions, and config files.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { LR_PLUGINS, THIRD_PARTY_PLUGINS, HOSTING_OPTIONS } from '../config/plugins.mjs';
import { cancel } from '../utils/cancel.mjs';

export async function promptLrPlugins() {
	const selected = await p.multiselect({
		message: 'LindemannRock plugins',
		options: LR_PLUGINS.map((pl) => ({
			value: pl.value,
			label: pl.label,
			hint: pl.hint,
		})),
		required: false,
	});
	if (p.isCancel(selected)) cancel();
	return LR_PLUGINS.filter((pl) => selected.includes(pl.value));
}

export async function promptThirdPartyPlugins() {
	const selected = await p.multiselect({
		message: 'Third-party plugins',
		options: THIRD_PARTY_PLUGINS.map((pl) => ({
			value: pl.value,
			label: pl.label,
			hint: pl.hint,
		})),
		required: false,
	});
	if (p.isCancel(selected)) cancel();
	return THIRD_PARTY_PLUGINS.filter((pl) => selected.includes(pl.value));
}

export async function promptHosting() {
	const hosting = await p.select({
		message: 'Hosting provider',
		options: HOSTING_OPTIONS.map((h) => ({
			value: h.value,
			label: h.label,
			hint: h.hint,
		})),
	});
	if (p.isCancel(hosting)) cancel();
	return HOSTING_OPTIONS.find((h) => h.value === hosting);
}
