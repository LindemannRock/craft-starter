/**
 * Database engine prompt.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { getDatabaseOption } from '../config/databases.mjs';
import { resolveCraftProfile } from '../config/craft-profiles.mjs';
import { cancel } from '../utils/cancel.mjs';

export async function promptDatabase({ craftProfile } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const selected = await p.select({
		message: 'Database engine',
		options: profile.database.options.map((option) => ({
			value: option.value,
			label: option.label,
			hint: option.hint,
		})),
		initialValue: profile.database.default,
	});
	if (p.isCancel(selected)) cancel();
	return getDatabaseOption(selected, profile);
}
