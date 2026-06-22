/**
 * Database engine prompt.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { DATABASE_OPTIONS, DEFAULT_DATABASE, getDatabaseOption } from '../config/databases.mjs';
import { cancel } from '../utils/cancel.mjs';

export async function promptDatabase() {
	const selected = await p.select({
		message: 'Database engine',
		options: DATABASE_OPTIONS.map((option) => ({
			value: option.value,
			label: option.label,
			hint: option.hint,
		})),
		initialValue: DEFAULT_DATABASE.value,
	});
	if (p.isCancel(selected)) cancel();
	return getDatabaseOption(selected);
}
