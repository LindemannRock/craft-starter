/**
 * Versioned Craft platform profiles.
 *
 * Generator code should read framework-specific dependencies, paths, and env
 * keys from this module rather than branching on a Craft major version. Only
 * complete profiles belong in CRAFT_PROFILES. Experimental profiles must be
 * explicitly labelled and keep unverified capabilities disabled.
 */

import path from 'path';

export const DEFAULT_CRAFT_PROFILE_ID = 'craft5';

export const CRAFT_PROFILES = Object.freeze({
	craft5: Object.freeze({
		id: 'craft5',
		major: 5,
		label: 'Craft CMS 5',
		experimental: false,
		features: Object.freeze({
			plugins: true,
			redis: true,
			criticalCss: true,
			rebrandAssets: true,
			favicons: true,
		}),
		release: Object.freeze({
			defaultChannel: 'stable',
			channels: Object.freeze({
				stable: Object.freeze({
					label: 'Stable',
					composerRequire: Object.freeze({'craftcms/cms': '^5.10.13'}),
				}),
			}),
		}),
		php: Object.freeze({
			default: '8.3',
			options: Object.freeze([
				{value: '8.5', label: '8.5', hint: 'latest stable'},
				{value: '8.4', label: '8.4', hint: 'supported by Craft 5.9+'},
				{value: '8.3', label: '8.3', hint: 'starter default'},
				{value: '8.2', label: '8.2', hint: 'Craft 5 minimum'},
			]),
		}),
		database: Object.freeze({
			default: 'mysql',
			options: Object.freeze([
				{
					value: 'mysql',
					label: 'MySQL 8.0',
					hint: 'Default for most Craft projects',
					ddevType: 'mysql',
					ddevVersion: '8.0',
					craftDriver: 'mysql',
					craftPort: '3306',
					craftSchema: '',
				},
				{
					value: 'postgres',
					label: 'PostgreSQL 18',
					hint: 'Latest stable PostgreSQL',
					ddevType: 'postgres',
					ddevVersion: '18',
					craftDriver: 'pgsql',
					craftPort: '5432',
					craftSchema: 'public',
				},
				{
					value: 'postgres-16',
					label: 'PostgreSQL 16',
					hint: 'Craft 5 baseline',
					ddevType: 'postgres',
					ddevVersion: '16',
					craftDriver: 'pgsql',
					craftPort: '5432',
					craftSchema: 'public',
				},
			]),
		}),
		ddev: Object.freeze({
			projectType: 'craftcms',
			docroot: 'web',
			uploadDirs: Object.freeze(['web/assets', 'storage']),
			databaseComments: Object.freeze([
				'Craft 5 requires: MySQL 8.0.36+, MariaDB 10.4.6+, or PostgreSQL 16+.',
				'MySQL 8.0 is the Servd default. To switch:',
				'  PostgreSQL: type: postgres, version: "16"',
				'  MariaDB:    type: mariadb,  version: "10.11"',
				'Run `ddev delete -Oy && ddev start` after changing.',
			]),
		}),
		commands: Object.freeze({
			pluginInstall: Object.freeze(['php', 'craft', 'plugin/install']),
			editionInspector: Object.freeze(['php', 'cli/scripts/inspect-plugin-editions.php']),
			projectConfigurator: Object.freeze(['php', 'cli/scripts/configure-project.php']),
			schemaVersion: Object.freeze(['php', 'craft', 'project-config/get', 'system.schemaVersion']),
			projectInstall: Object.freeze(['php', 'craft', 'install']),
			projectUp: Object.freeze(['php', 'craft', 'up', '--interactive=0']),
			setupKeys: Object.freeze(['php', 'craft', 'setup/keys']),
			update: Object.freeze(['php', 'craft', 'update']),
			resaveEntries: Object.freeze(['php', 'craft', 'resave/entries']),
			installOptions: Object.freeze({
				nonInteractive: '--interactive=0',
				siteName: '--site-name',
				siteUrl: '--site-url',
			}),
		}),
		plugins: Object.freeze({
			coreHandles: Object.freeze(['ckeditor', 'vite']),
		}),
		paths: Object.freeze({
			public: 'web',
			publicRuntimeIgnores: Object.freeze([]),
			build: 'web/dist',
			assets: 'web/assets',
			templates: 'templates',
			craftConfig: 'config',
			pluginConfig: 'config',
			generalConfig: 'config/general.php',
			viteConfig: 'config/vite.php',
			projectConfig: 'config/project',
			criticalPartial: 'templates/_boilerplate/_partials/critical-css.twig',
			translations: 'translations',
			rebrand: 'storage/rebrand',
			licenseKey: 'config/license.key',
			runtimeDirectories: Object.freeze(['storage/logs', 'storage/runtime']),
			envTemplate: 'cli/templates/env.example',
			translationTemplate: 'cli/templates/translations/site.php',
		}),
		env: Object.freeze({
			application: Object.freeze({
				id: 'CRAFT_APP_ID',
				key: 'CRAFT_SECURITY_KEY',
				keyPrefix: '',
				name: null,
				environment: null,
				debug: null,
				url: null,
				locale: null,
			}),
			mail: Object.freeze({
				mailer: null,
				host: 'SMTP_HOSTNAME',
				port: 'SMTP_PORT',
				username: 'SMTP_USERNAME',
				password: 'SMTP_PASSWORD',
				scheme: 'SMTP_ENCRYPTION_METHOD',
				useAuth: 'SMTP_USE_AUTH',
				fromAddress: 'SYSTEM_EMAIL',
				fromName: 'SYSTEM_SENDER_NAME',
				replyTo: 'SYSTEM_EMAIL_REPLY_TO',
			}),
			database: Object.freeze({
				driver: 'CRAFT_DB_DRIVER',
				server: 'CRAFT_DB_SERVER',
				port: 'CRAFT_DB_PORT',
				database: 'CRAFT_DB_DATABASE',
				user: 'CRAFT_DB_USER',
				password: 'CRAFT_DB_PASSWORD',
				schema: 'CRAFT_DB_SCHEMA',
				tablePrefix: 'CRAFT_DB_TABLE_PREFIX',
			}),
		}),
		composer: Object.freeze({
			require: Object.freeze({
				'craftcms/ckeditor': '^5.6.1',
				'nystudio107/craft-vite': '^5.0.2',
				'vlucas/phpdotenv': '^5.6.4',
			}),
			requireDev: Object.freeze({
				'craftcms/generator': '^2.2.0',
				'yiisoft/yii2-shell': '^2.0.6',
			}),
			redis: Object.freeze({name: 'yiisoft/yii2-redis', version: '^2.1.2'}),
			project: Object.freeze({
				autoload: Object.freeze({psr4: Object.freeze({'modules\\': 'modules/'})}),
				autoloadDev: null,
				scripts: null,
				extra: null,
				allowPlugins: Object.freeze({
					'craftcms/plugin-installer': true,
					'php-http/discovery': true,
					'yiisoft/yii2-composer': true,
				}),
			}),
		}),
		frontend: Object.freeze({
			devDependencies: Object.freeze({}),
		}),
		scaffold: null,
	}),
	craft6: Object.freeze({
		id: 'craft6',
		major: 6,
		label: 'Craft CMS 6',
		experimental: true,
		features: Object.freeze({
			plugins: false,
			redis: false,
			criticalCss: false,
			rebrandAssets: false,
			favicons: false,
		}),
		release: Object.freeze({
			defaultChannel: 'alpha',
			channels: Object.freeze({
				alpha: Object.freeze({
					label: 'Alpha (experimental)',
					hint: 'Scaffolding tests only — not for production',
					composerRequire: Object.freeze({'craftcms/cms': '^6.0.0-alpha.16'}),
				}),
			}),
		}),
		php: Object.freeze({
			default: '8.5',
			options: Object.freeze([{value: '8.5', label: '8.5', hint: 'Craft 6 alpha requirement'}]),
		}),
		database: Object.freeze({
			default: 'mysql',
			options: Object.freeze([
				{
					value: 'mysql',
					label: 'MySQL 8.4',
					hint: 'Craft 6 recommended local database',
					ddevType: 'mysql',
					ddevVersion: '8.4',
					craftDriver: 'mysql',
					craftPort: '3306',
					craftSchema: '',
				},
				{
					value: 'postgres',
					label: 'PostgreSQL 18',
					hint: 'Latest stable PostgreSQL',
					ddevType: 'postgres',
					ddevVersion: '18',
					craftDriver: 'pgsql',
					craftPort: '5432',
					craftSchema: 'public',
				},
			]),
		}),
		ddev: Object.freeze({
			projectType: 'laravel',
			docroot: 'public',
			uploadDirs: Object.freeze(['public/assets', 'storage']),
			databaseComments: Object.freeze([
				'Craft 6 alpha profile options: MySQL 8.4 or PostgreSQL 18.',
				'Run `make create` again to select a different database engine.',
			]),
		}),
		commands: Object.freeze({
			pluginInstall: Object.freeze(['php', 'craft', 'plugin:install']),
			editionInspector: Object.freeze(['php', 'cli/scripts/inspect-plugin-editions-v6.php']),
			projectConfigurator: Object.freeze(['php', 'cli/scripts/configure-project-v6.php']),
			schemaVersion: Object.freeze(['php', 'cli/scripts/project-config-value-v6.php', 'system.schemaVersion']),
			projectInstall: Object.freeze(['php', 'craft', 'install']),
			projectUp: Object.freeze(['php', 'craft', 'up', '--no-interaction']),
			setupKeys: Object.freeze(['php', 'artisan', 'key:generate']),
			update: Object.freeze(['php', 'craft', 'update']),
			resaveEntries: Object.freeze(['php', 'craft', 'resave:entries']),
			installOptions: Object.freeze({
				nonInteractive: '--no-interaction',
				siteName: '--siteName',
				siteUrl: '--siteUrl',
			}),
		}),
		plugins: Object.freeze({
			coreHandles: Object.freeze([]),
		}),
		paths: Object.freeze({
			public: 'public',
			publicRuntimeIgnores: Object.freeze(['public/hot', 'public/vendor/']),
			build: 'public/build',
			assets: 'public/assets',
			templates: 'resources/views',
			craftConfig: 'config/craft',
			pluginConfig: 'config/craft',
			generalConfig: 'config/craft/general.php',
			viteConfig: 'vite.config.mjs',
			projectConfig: 'config/craft/project',
			criticalPartial: 'resources/views/_boilerplate/_partials/critical-css.twig',
			translations: 'lang',
			rebrand: 'storage/rebrand',
			licenseKey: 'config/craft/license.key',
			runtimeDirectories: Object.freeze([
				'bootstrap/cache',
				'storage/framework/cache/data',
				'storage/framework/sessions',
				'storage/framework/views',
				'storage/inertia-devtools',
				'storage/logs',
				'storage/runtime',
			]),
			envTemplate: 'cli/templates/platforms/craft6/env.example',
			translationTemplate: 'cli/templates/translations/site.php',
		}),
		env: Object.freeze({
			application: Object.freeze({
				id: null,
				key: 'APP_KEY',
				keyPrefix: 'base64:',
				name: 'APP_NAME',
				environment: 'APP_ENV',
				debug: 'APP_DEBUG',
				url: 'APP_URL',
				locale: 'APP_LOCALE',
			}),
			mail: Object.freeze({
				mailer: 'MAIL_MAILER',
				host: 'MAIL_HOST',
				port: 'MAIL_PORT',
				username: 'MAIL_USERNAME',
				password: 'MAIL_PASSWORD',
				scheme: 'MAIL_SCHEME',
				useAuth: null,
				fromAddress: 'MAIL_FROM_ADDRESS',
				fromName: 'MAIL_FROM_NAME',
				replyTo: null,
			}),
			database: Object.freeze({
				driver: 'DB_CONNECTION',
				server: 'DB_HOST',
				port: 'DB_PORT',
				database: 'DB_DATABASE',
				user: 'DB_USERNAME',
				password: 'DB_PASSWORD',
				schema: 'DB_SEARCH_PATH',
				tablePrefix: 'DB_PREFIX',
			}),
		}),
		composer: Object.freeze({
			require: Object.freeze({
				'laravel/framework': '^13.8',
				'laravel/tinker': '^3.0',
			}),
			requireDev: Object.freeze({}),
			redis: null,
			project: Object.freeze({
				autoload: Object.freeze({
					psr4: Object.freeze({
						'App\\': 'app/',
						'Database\\Factories\\': 'database/factories/',
						'Database\\Seeders\\': 'database/seeders/',
					}),
				}),
				autoloadDev: Object.freeze({psr4: Object.freeze({'Tests\\': 'tests/'})}),
				scripts: Object.freeze({
					'post-autoload-dump': Object.freeze([
						'Illuminate\\Foundation\\ComposerScripts::postAutoloadDump',
						'@php artisan package:discover --ansi',
						'@php artisan craft:setup:publish --ansi',
					]),
					'post-update-cmd': Object.freeze(['@php artisan vendor:publish --tag=laravel-assets --ansi --force']),
					'pre-package-uninstall': Object.freeze(['Illuminate\\Foundation\\ComposerScripts::prePackageUninstall']),
				}),
				extra: Object.freeze({laravel: Object.freeze({'dont-discover': Object.freeze([])})}),
				allowPlugins: Object.freeze({
					'craftcms/plugin-installer': true,
					'php-http/discovery': true,
				}),
			}),
		}),
		frontend: Object.freeze({
			devDependencies: Object.freeze({'laravel-vite-plugin': '^3.0.0'}),
		}),
		scaffold: Object.freeze({
			package: 'craftcms/craft',
			version: '6.0.0-alpha.2',
			moves: Object.freeze([
				Object.freeze(['templates', 'resources/views']),
				Object.freeze(['web', 'public']),
				Object.freeze(['translations', 'lang']),
				Object.freeze(['config/routes.php', 'config/craft/routes.php']),
				Object.freeze(['config/license.key', 'config/craft/license.key']),
			]),
			remove: Object.freeze([
				'bootstrap.php',
				'config/app.web.php',
				'config/general.php',
				'config/vite.php',
				'public/dist',
			]),
			copy: Object.freeze([
				'app',
				'bootstrap',
				'database',
				'routes',
				'storage',
				'artisan',
				'craft',
				'phpunit.xml',
				'config/app.php',
				'config/auth.php',
				'config/cache.php',
				'config/database.php',
				'config/filesystems.php',
				'config/logging.php',
				'config/mail.php',
				'config/queue.php',
				'config/services.php',
				'config/session.php',
				'public/.htaccess',
				'public/index.php',
				'public/robots.txt',
			]),
			overlay: 'cli/templates/platforms/craft6/overlay',
			cleanup: Object.freeze([
				'app',
				'bootstrap',
				'database',
				'routes',
				'artisan',
				'phpunit.xml',
				'public',
				'resources',
				'lang',
				'config/craft',
				'config/auth.php',
				'config/cache.php',
				'config/database.php',
				'config/filesystems.php',
				'config/logging.php',
				'config/mail.php',
				'config/queue.php',
				'config/services.php',
				'config/session.php',
				'storage/app',
				'storage/framework',
				'storage/inertia-devtools',
			]),
		}),
	}),
});

const REQUIRED_PROFILE_KEYS = [
	'id',
	'major',
	'label',
	'experimental',
	'features.plugins',
	'features.redis',
	'features.criticalCss',
	'features.rebrandAssets',
	'features.favicons',
	'release.defaultChannel',
	'php.default',
	'php.options',
	'database.default',
	'database.options',
	'ddev.projectType',
	'ddev.docroot',
	'ddev.uploadDirs',
	'ddev.databaseComments',
	'commands.pluginInstall',
	'commands.editionInspector',
	'commands.projectConfigurator',
	'commands.schemaVersion',
	'commands.projectInstall',
	'commands.projectUp',
	'commands.setupKeys',
	'commands.update',
	'commands.resaveEntries',
	'commands.installOptions.nonInteractive',
	'commands.installOptions.siteName',
	'commands.installOptions.siteUrl',
	'plugins.coreHandles',
	'paths.public',
	'paths.publicRuntimeIgnores',
	'paths.build',
	'paths.assets',
	'paths.templates',
	'paths.craftConfig',
	'paths.pluginConfig',
	'paths.generalConfig',
	'paths.viteConfig',
	'paths.projectConfig',
	'paths.criticalPartial',
	'paths.translations',
	'paths.rebrand',
	'paths.licenseKey',
	'paths.runtimeDirectories',
	'paths.envTemplate',
	'paths.translationTemplate',
	'env.database.driver',
	'env.database.server',
	'env.database.port',
	'env.database.database',
	'env.database.user',
	'env.database.password',
	'env.database.schema',
	'env.database.tablePrefix',
	'composer.require',
	'composer.requireDev',
	'composer.project',
	'frontend.devDependencies',
];

export function validateCraftProfile(profile) {
	const missing = REQUIRED_PROFILE_KEYS.filter((key) => {
		const value = key.split('.').reduce((current, part) => current?.[part], profile);
		return value === undefined || value === null || value === '';
	});
	if (missing.length > 0) {
		throw new Error(`Incomplete Craft profile "${profile?.id || '(unknown)'}": missing ${missing.join(', ')}.`);
	}
	if (!profile.release.channels[profile.release.defaultChannel]) {
		throw new Error(
			`Incomplete Craft profile "${profile.id}": default release channel "${profile.release.defaultChannel}" is not defined.`,
		);
	}
	if (!profile.php.options.some(({value}) => value === profile.php.default)) {
		throw new Error(`Incomplete Craft profile "${profile.id}": default PHP ${profile.php.default} is not selectable.`);
	}
	if (!profile.database.options.some(({value}) => value === profile.database.default)) {
		throw new Error(
			`Incomplete Craft profile "${profile.id}": default database "${profile.database.default}" is not selectable.`,
		);
	}
	return true;
}

for (const [id, profile] of Object.entries(CRAFT_PROFILES)) {
	validateCraftProfile(profile);
	if (id !== profile.id) throw new Error(`Craft profile key "${id}" must match its id "${profile.id}".`);
}

const profileMajors = Object.values(CRAFT_PROFILES).map(({major}) => major);
if (new Set(profileMajors).size !== profileMajors.length) {
	throw new Error('Craft profile major versions must be unique.');
}

export const DEFAULT_CRAFT_PROFILE = CRAFT_PROFILES[DEFAULT_CRAFT_PROFILE_ID];

export function resolveCraftProfile(value = DEFAULT_CRAFT_PROFILE_ID) {
	if (value && typeof value === 'object') {
		if (value.id !== undefined) value = value.id;
		else if (value.profile !== undefined) value = value.profile;
		else if (value.major !== undefined) value = value.major;
	}

	const id = typeof value === 'number' || /^\d+$/.test(String(value)) ? `craft${value}` : String(value);
	const profile = CRAFT_PROFILES[id];
	if (!profile) {
		throw new Error(
			`Unsupported Craft profile "${id}". Available profiles: ${Object.keys(CRAFT_PROFILES).join(', ')}.`,
		);
	}
	return profile;
}

export function craftManifestMetadata(value = DEFAULT_CRAFT_PROFILE_ID, channel) {
	const profile = resolveCraftProfile(value);
	const release = resolveCraftRelease(profile, channel);
	return {profile: profile.id, major: profile.major, channel: release.channel};
}

export function resolveCraftRelease(value = DEFAULT_CRAFT_PROFILE_ID, channel) {
	const profile = resolveCraftProfile(value);
	const releaseChannel = channel || profile.release.defaultChannel;
	const release = profile.release.channels[releaseChannel];
	if (!release) {
		throw new Error(
			`Unsupported ${profile.label} release channel "${releaseChannel}". Available channels: ${Object.keys(profile.release.channels).join(', ')}.`,
		);
	}
	return {channel: releaseChannel, ...release};
}

export function composerConfigForCraftProfile(value = DEFAULT_CRAFT_PROFILE_ID, channel) {
	const profile = resolveCraftProfile(value);
	const release = resolveCraftRelease(profile, channel);
	return {
		require: {...profile.composer.require, ...release.composerRequire},
		requireDev: {...profile.composer.requireDev},
		redis: profile.composer.redis ? {...profile.composer.redis} : null,
		project: profile.composer.project,
	};
}

export function craftProjectPath(root, key, value = DEFAULT_CRAFT_PROFILE_ID) {
	const profile = resolveCraftProfile(value);
	const relativePath = profile.paths[key];
	if (!relativePath) throw new Error(`Craft profile "${profile.id}" does not define path "${key}".`);
	return path.join(root, relativePath);
}

/** Existing catalogue entries without compatibility metadata are Craft 5-only. */
export function resolvePluginForCraftProfile(plugin, value = DEFAULT_CRAFT_PROFILE_ID) {
	const profile = resolveCraftProfile(value);
	const overrides = plugin.craft?.[profile.major];
	if (plugin.craft && !overrides) return null;
	if (!plugin.craft && profile.major !== 5) return null;
	return overrides ? {...plugin, ...overrides} : {...plugin};
}

export function catalogForCraftProfile(items, value = DEFAULT_CRAFT_PROFILE_ID) {
	return items.map((item) => resolvePluginForCraftProfile(item, value)).filter(Boolean);
}

export const pluginsForCraftProfile = catalogForCraftProfile;

export function allManagedPlatformPackages() {
	return new Set(
		Object.values(CRAFT_PROFILES)
			.flatMap((profile) => [
				...Object.keys(profile.composer.require),
				...Object.keys(profile.composer.requireDev),
				profile.composer.redis?.name,
				...Object.values(profile.release.channels).flatMap((release) => Object.keys(release.composerRequire)),
			])
			.filter(Boolean),
	);
}

export function allManagedFrontendPackages() {
	return new Set(Object.values(CRAFT_PROFILES).flatMap((profile) => Object.keys(profile.frontend.devDependencies)));
}
