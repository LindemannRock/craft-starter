/**
 * Build artifact tracking prompt.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';

export async function promptBuildFiles() {
	const choice = await p.select({
		message: 'Commit built frontend files?',
		options: [
			{
				value: 'track',
				label: 'Yes, track web/dist',
				hint: 'For hosts without a build step',
			},
			{
				value: 'ignore',
				label: 'No, ignore web/dist',
				hint: 'For CI or hosting builds',
			},
		],
		initialValue: 'track',
	});
	if (p.isCancel(choice)) cancel();
	return choice === 'track';
}
