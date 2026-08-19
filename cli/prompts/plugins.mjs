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

const byLabel = (a, b) => a.label.localeCompare(b.label);

export async function promptLrPlugins(catalog = LR_PLUGINS) {
	const selected = await p.autocompleteMultiselect({
		message: 'LindemannRock plugins',
		options: [...catalog].sort(byLabel).map((pl) => ({
			value: pl.value,
			label: pl.label,
			hint: pl.hint,
		})),
		required: false,
	});
	if (p.isCancel(selected)) cancel();
	return catalog.filter((pl) => selected.includes(pl.value));
}

export async function promptThirdPartyPlugins(catalog = THIRD_PARTY_PLUGINS) {
	const selected = await p.autocompleteMultiselect({
		message: 'Third-party plugins',
		options: [...catalog].sort(byLabel).map((pl) => ({
			value: pl.value,
			label: pl.label,
			hint: pl.hint,
		})),
		required: false,
	});
	if (p.isCancel(selected)) cancel();
	return catalog.filter((pl) => selected.includes(pl.value));
}

/** Ask for a Craft edition before installation for plugins that expose more than one. */
export async function promptPluginEditions(plugins) {
	const resolved = [];
	for (const plugin of plugins) {
		if (!plugin.editions || plugin.editions.length < 2) {
			resolved.push(plugin);
			continue;
		}

		const edition = await p.select({
			message: `${plugin.label} edition`,
			options: plugin.editions,
			initialValue: plugin.edition || plugin.defaultEdition || plugin.editions[0].value,
		});
		if (p.isCancel(edition)) cancel();
		resolved.push({ ...plugin, edition });
	}
	return resolved;
}

export async function promptHosting(catalog = HOSTING_OPTIONS) {
	const hosting = await p.select({
		message: 'Hosting provider',
		options: catalog.map((h) => ({
			value: h.value,
			label: h.label,
			hint: h.hint,
		})),
	});
	if (p.isCancel(hosting)) cancel();
	return catalog.find((h) => h.value === hosting);
}
