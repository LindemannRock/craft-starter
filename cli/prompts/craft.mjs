/**
 * Select the Craft platform and release channel.
 *
 * Multiple profiles are selected before project-specific questions. An
 * experimental profile requires a second explicit confirmation.
 */

import * as p from '@clack/prompts';
import {
	CRAFT_PROFILES,
	DEFAULT_CRAFT_PROFILE,
	resolveCraftProfile,
	resolveCraftRelease,
} from '../config/craft-profiles.mjs';
import { cancel } from '../utils/cancel.mjs';

export async function promptCraftPlatform({ initialProfile = DEFAULT_CRAFT_PROFILE, initialChannel } = {}) {
	const profiles = Object.values(CRAFT_PROFILES);
	let profile = resolveCraftProfile(initialProfile);

	if (profiles.length > 1) {
		const profileId = await p.select({
			message: 'Craft CMS version',
			options: profiles.map((candidate) => ({
				value: candidate.id,
				label: candidate.label,
				hint: candidate.release.channels[candidate.release.defaultChannel].hint,
			})),
			initialValue: profile.id,
		});
		if (p.isCancel(profileId)) cancel();
		profile = resolveCraftProfile(profileId);
	}
	if (profile.experimental) {
		const confirmed = await p.confirm({
			message: `${profile.label} is experimental and may fail during setup. Continue?`,
			initialValue: false,
		});
		if (p.isCancel(confirmed) || !confirmed) cancel('Experimental Craft setup cancelled.');
	}

	const channels = Object.entries(profile.release.channels);
	let channel = initialChannel || profile.release.defaultChannel;
	if (!profile.release.channels[channel]) channel = profile.release.defaultChannel;
	if (channels.length > 1) {
		channel = await p.select({
			message: `${profile.label} release channel`,
			options: channels.map(([value, release]) => ({
				value,
				label: release.label,
				hint: release.hint,
			})),
			initialValue: channel,
		});
		if (p.isCancel(channel)) cancel();
	}

	return { profile, channel: resolveCraftRelease(profile, channel).channel };
}
