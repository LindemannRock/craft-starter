/**
 * Build artifact tracking prompt.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';
import { resolveCraftProfile } from '../config/craft-profiles.mjs';

export async function promptBuildFiles({ craftProfile } = {}) {
	const profile = resolveCraftProfile(craftProfile);
	const choice = await p.select({
		message: 'Commit built frontend files?',
		options: [
			{
				value: 'track',
				label: `Yes, track ${profile.paths.build}`,
				hint: 'For hosts without a build step',
			},
			{
				value: 'ignore',
				label: `No, ignore ${profile.paths.build}`,
				hint: 'For CI or hosting builds',
			},
		],
		initialValue: 'track',
	});
	if (p.isCancel(choice)) cancel();
	return choice === 'track';
}
