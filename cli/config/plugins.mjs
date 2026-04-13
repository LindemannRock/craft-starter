/**
 * Plugin registry — composer packages, Craft plugin handles, and config file names.
 *
 * - CORE_REQUIRE / CORE_REQUIRE_DEV: always installed, never prompted
 * - CORE_PLUGIN_HANDLES: always activated via `php craft plugin/install`
 * - LR_PLUGINS / THIRD_PARTY_PLUGINS: user-selectable via the CLI
 * - HOSTING_OPTIONS: user-selectable hosting provider
 *
 * To add a new plugin: add an entry here and (if it needs config) drop a PHP
 * file in cli/templates/plugins/{name}.php
 */

// -----------------------------------------------------------------------------
// Core — always installed, never prompted
// -----------------------------------------------------------------------------

export const CORE_REQUIRE = {
	'craftcms/cms': '^5.9.18',
	'craftcms/ckeditor': '^5.4.0',
	'nystudio107/craft-vite': '^5.0.1',
	'vlucas/phpdotenv': '^5.6.0',
};

export const CORE_REQUIRE_DEV = {
	'craftcms/generator': '^2.0.0',
	'yiisoft/yii2-shell': '^2.0.3',
};

// Craft plugin handles always activated after install
export const CORE_PLUGIN_HANDLES = ['ckeditor', 'vite'];

// Optional: Redis cache package — only added when user opts in
export const REDIS_PACKAGE = {
	name: 'yiisoft/yii2-redis',
	version: '^2.1',
};

// -----------------------------------------------------------------------------
// LindemannRock plugins
// -----------------------------------------------------------------------------

export const LR_PLUGINS = [
	{
		value: 'lindemannrock/craft-campaign-manager',
		handle: 'campaign-manager',
		version: '^5.7',
		label: 'Campaign Manager',
		hint: 'SMS, email, WhatsApp campaigns',
		config: null,
	},
	{
		value: 'lindemannrock/craft-code-highlighter',
		handle: 'code-highlighter',
		version: '^5.5',
		label: 'Code Highlighter',
		hint: 'Syntax highlighting (Prism.js)',
		config: null,
	},
	{
		value: 'lindemannrock/craft-component-manager',
		handle: 'component-manager',
		version: '^5.5',
		label: 'Component Manager',
		hint: 'Advanced component management',
		config: null,
	},
	{
		value: 'lindemannrock/craft-formie-booking-slot-field',
		handle: 'formie-booking-slot-field',
		version: '^3.4',
		label: 'Formie Booking Slot',
		hint: 'Date/time slot selection for Formie',
		config: null,
	},
	{
		value: 'lindemannrock/craft-formie-paragraph-field',
		handle: 'formie-paragraph-field',
		version: '^3.2',
		label: 'Formie Paragraph',
		hint: 'Multi-line paragraph field for Formie',
		config: null,
	},
	{
		value: 'lindemannrock/craft-formie-rating-field',
		handle: 'formie-rating-field',
		version: '^3.15',
		label: 'Formie Rating',
		hint: 'Star/emoji/numeric rating for Formie',
		config: null,
	},
	{
		value: 'lindemannrock/craft-formie-rest-api',
		handle: 'formie-rest-api',
		version: '^3.3',
		label: 'Formie REST API',
		hint: 'REST + GraphQL API for Formie',
		config: null,
	},
	{
		value: 'lindemannrock/craft-formie-sap-integration',
		handle: 'formie-sap-integration',
		version: '^3.3',
		label: 'Formie SAP Integration',
		hint: 'Send Formie submissions to SAP Cloud',
		config: null,
	},
	{
		value: 'lindemannrock/craft-formie-sms',
		handle: 'formie-sms',
		version: '^3.8',
		label: 'Formie SMS',
		hint: 'SMS notifications for Formie',
		config: null,
	},
	{
		value: 'lindemannrock/craft-icon-manager',
		handle: 'icon-manager',
		version: '^5.12',
		label: 'Icon Manager',
		hint: 'SVG + icon font management',
		config: null,
	},
	{
		value: 'lindemannrock/craft-logging-library',
		handle: 'logging-library',
		version: '^5.0',
		label: 'Logging Library',
		hint: 'Centralized logging',
		config: null,
	},
	{
		value: 'lindemannrock/craft-redirect-manager',
		handle: 'redirect-manager',
		version: '^5.19',
		label: 'Redirect Manager',
		hint: 'Auto-redirects + analytics',
		config: 'redirect-manager.php',
		ipSaltEnv: 'REDIRECT_MANAGER_IP_SALT',
	},
	{
		value: 'lindemannrock/craft-report-manager',
		handle: 'report-manager',
		version: '^5.2',
		label: 'Report Manager',
		hint: 'Report generation + analytics',
		config: null,
	},
	{
		value: 'lindemannrock/craft-search-manager',
		handle: 'search-manager',
		version: '^5.34',
		label: 'Search Manager',
		hint: 'Search analytics + synonyms',
		config: null,
		ipSaltEnv: 'SEARCH_MANAGER_IP_SALT',
	},
	{
		value: 'lindemannrock/craft-shortlink-manager',
		handle: 'shortlink-manager',
		version: '^5.8',
		label: 'Shortlink Manager',
		hint: 'Short links + QR codes',
		config: 'shortlink-manager.php',
		ipSaltEnv: 'SHORTLINK_MANAGER_IP_SALT',
	},
	{
		value: 'lindemannrock/craft-smartlink-manager',
		handle: 'smartlink-manager',
		version: '^5.0',
		label: 'Smartlink Manager',
		hint: 'Device-aware smart links',
		config: null,
		ipSaltEnv: 'SMARTLINK_MANAGER_IP_SALT',
	},
	{
		value: 'lindemannrock/craft-sms-manager',
		handle: 'sms-manager',
		version: '^5.10',
		label: 'SMS Manager',
		hint: 'SMS gateway (multi-provider)',
		config: null,
	},
	{
		value: 'lindemannrock/craft-translation-manager',
		handle: 'translation-manager',
		version: '^5.14',
		label: 'Translation Manager',
		hint: 'Translation management',
		config: 'translation-manager.php',
	},
];

// -----------------------------------------------------------------------------
// Third-party plugins
// -----------------------------------------------------------------------------

export const THIRD_PARTY_PLUGINS = [
	{
		value: 'nystudio107/craft-seomatic',
		handle: 'seomatic',
		version: '^5.1.21',
		label: 'SEOmatic',
		hint: 'SEO management',
		config: 'seomatic.php',
	},
	{
		value: 'verbb/formie',
		handle: 'formie',
		version: '^3.1.19',
		label: 'Formie',
		hint: 'Form builder',
		config: 'formie.php',
	},
	{
		value: 'verbb/navigation',
		handle: 'navigation',
		version: '^3.0.18',
		label: 'Navigation',
		hint: 'Navigation management',
		config: null,
	},
	{
		value: 'verbb/expanded-singles',
		handle: 'expanded-singles',
		version: '^3.0.3',
		label: 'Expanded Singles',
		hint: 'Singles as sidebar links',
		config: null,
	},
	{
		value: 'spacecatninja/imager-x',
		handle: 'imager-x',
		version: '^5.2.1',
		label: 'Imager X',
		hint: 'Image transforms',
		config: 'imager-x.php',
	},
	{
		value: 'craftcms/postmark',
		handle: 'postmark',
		version: '^3.1.0',
		label: 'Postmark',
		hint: 'Email transport',
		config: null,
	},
	{
		value: 'putyourlightson/craft-sprig',
		handle: 'sprig',
		version: '^3.7.1',
		label: 'Sprig',
		hint: 'Reactive Twig components',
		config: null,
	},
	{
		value: 'doublesecretagency/craft-cpcss',
		handle: 'cp-css',
		version: '^3.0.0',
		label: 'CP CSS',
		hint: 'Custom control panel CSS',
		config: null,
	},
	{
		value: 'doublesecretagency/craft-cpjs',
		handle: 'cp-js',
		version: '^3.0.0',
		label: 'CP JS',
		hint: 'Custom control panel JS',
		config: null,
	},
	{
		value: 'mmikkel/cp-clearcache',
		handle: 'cp-clearcache',
		version: '^2.0.1',
		label: 'CP Clear Cache',
		hint: 'Clear cache from CP toolbar',
		config: null,
	},
	{
		value: 'putyourlightson/craft-cloudflare',
		handle: 'cloudflare',
		version: '^3.1.2',
		label: 'Cloudflare',
		hint: 'Purge Cloudflare cache from Craft',
		config: null,
	},
];

// -----------------------------------------------------------------------------
// Hosting providers
// -----------------------------------------------------------------------------

export const HOSTING_OPTIONS = [
	{
		value: 'servd',
		label: 'Servd',
		hint: 'Craft CMS hosting',
		packages: [
			{ name: 'servd/craft-asset-storage', version: '^4.2.4.2', handle: 'servd-asset-storage' },
		],
	},
	{
		value: 'craft-cloud',
		label: 'Craft Cloud',
		hint: 'Official Craft hosting',
		packages: [
			{ name: 'craftcms/cloud', version: '*', handle: 'cloud' },
		],
	},
	{
		value: 'none',
		label: 'None / Self-hosted',
		hint: 'No hosting plugin',
		packages: [],
	},
];
