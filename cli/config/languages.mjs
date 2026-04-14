/**
 * Language / locale catalog for Craft CMS.
 * Used by the language prompt with autocomplete.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

// Common languages shown when the search input is empty (press Enter = English)
export const COMMON_LANGUAGES = [
	{ value: 'en-US', name: 'English (US)' },
	{ value: 'en-GB', name: 'English (UK)' },
	{ value: 'ar', name: 'Arabic' },
	{ value: 'de', name: 'German' },
	{ value: 'fr', name: 'French' },
	{ value: 'es', name: 'Spanish' },
	{ value: 'it', name: 'Italian' },
	{ value: 'nl', name: 'Dutch' },
	{ value: 'pt', name: 'Portuguese' },
	{ value: 'ja', name: 'Japanese' },
];

// Locale codes supported by Craft / ICU — practical subset covering common variants
const LOCALE_CODES = [
	'af', 'ar', 'ar-SA', 'ar-EG', 'ar-AE', 'az', 'be', 'bg', 'bn', 'bs', 'ca',
	'cs', 'cy', 'da', 'de', 'de-AT', 'de-CH', 'el', 'en', 'en-AU', 'en-CA',
	'en-GB', 'en-IE', 'en-IN', 'en-NZ', 'en-US', 'en-ZA', 'es', 'es-AR', 'es-CL',
	'es-CO', 'es-ES', 'es-MX', 'es-PE', 'es-US', 'es-VE', 'et', 'eu', 'fa', 'fi',
	'fil', 'fr', 'fr-BE', 'fr-CA', 'fr-CH', 'ga', 'gl', 'gu', 'he', 'hi', 'hr',
	'hu', 'hy', 'id', 'is', 'it', 'it-CH', 'ja', 'ka', 'kk', 'km', 'kn', 'ko',
	'lo', 'lt', 'lv', 'mk', 'ml', 'mn', 'mr', 'ms', 'my', 'nb', 'nb-NO', 'ne',
	'nl', 'nl-BE', 'nn', 'no', 'pa', 'pl', 'pt', 'pt-BR', 'pt-PT', 'ro', 'ru',
	'si', 'sk', 'sl', 'sq', 'sr', 'sv', 'sv-SE', 'sw', 'ta', 'te', 'th', 'tr',
	'uk', 'ur', 'uz', 'vi', 'zh', 'zh-CN', 'zh-HK', 'zh-TW',
];

// Full list with human-readable display names from Intl API
export const ALL_LANGUAGES = (function () {
	try {
		const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
		return LOCALE_CODES.map((code) => {
			try {
				const displayName = displayNames.of(code) || code;
				return { value: code, name: `${displayName} (${code})` };
			} catch {
				return { value: code, name: code };
			}
		});
	} catch {
		return COMMON_LANGUAGES;
	}
})();
