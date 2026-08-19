/** PHP compatibility aliases for the currently enabled default Craft profile. */

import { DEFAULT_CRAFT_PROFILE } from './craft-profiles.mjs';

export const DEFAULT_PHP_VERSION = DEFAULT_CRAFT_PROFILE.php.default;

export const PHP_VERSION_OPTIONS = DEFAULT_CRAFT_PROFILE.php.options;

export const SUPPORTED_PHP_VERSIONS = PHP_VERSION_OPTIONS.map(({ value }) => value);
