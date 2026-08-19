/** Database compatibility aliases for the default Craft profile. */

import { DEFAULT_CRAFT_PROFILE, resolveCraftProfile } from './craft-profiles.mjs';

export const DATABASE_OPTIONS = DEFAULT_CRAFT_PROFILE.database.options;

export const DEFAULT_DATABASE = getDatabaseOption(DEFAULT_CRAFT_PROFILE.database.default);

export function getDatabaseOption(value, craftProfile = DEFAULT_CRAFT_PROFILE) {
	const profile = resolveCraftProfile(craftProfile);
	return (
		profile.database.options.find((option) => option.value === value) ||
		profile.database.options.find((option) => option.value === profile.database.default)
	);
}
