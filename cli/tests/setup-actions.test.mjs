import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { updateComposer } from '../actions/composer.mjs';
import { syncRebrandAssets } from '../actions/assets.mjs';
import { updateDdevConfig } from '../actions/ddev.mjs';
import { updatePackageJson } from '../actions/packageJson.mjs';
import { buildCraftInstallCommand } from '../actions/install.mjs';
import { scaffoldTranslations, cleanUnusedTranslations } from '../actions/sites.mjs';
import { cleanUnusedPluginConfigs, pluginInstallArgs, validatePluginEditions } from '../actions/plugins.mjs';
import { HOSTING_OPTIONS, LR_PLUGINS, THIRD_PARTY_PLUGINS } from '../config/plugins.mjs';

const tempDirs = [];
const tempProject = () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-actions-test-'));
	tempDirs.push(root);
	return root;
};

afterEach(() => {
	for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('generator-owned dependencies', () => {
	it('preserves manually added Composer packages while reconciling selections', () => {
		const root = tempProject();
		fs.writeFileSync(
			path.join(root, 'composer.json'),
			JSON.stringify({
				require: { 'acme/custom-package': '^1.0', 'verbb/formie': '^3.0' },
				'require-dev': { 'acme/dev-tool': '^2.0' },
				autoload: { 'psr-4': { 'Acme\\': 'src/' } },
				scripts: { test: 'php test.php' },
			}),
		);
		updateComposer(
			{
				selectedLr: [],
				selectedTp: [],
				useRedisCache: false,
				selectedHosting: HOSTING_OPTIONS.find(({ value }) => value === 'none'),
			},
			{ root },
		);
		const composer = JSON.parse(fs.readFileSync(path.join(root, 'composer.json'), 'utf-8'));
		expect(composer.require['acme/custom-package']).toBe('^1.0');
		expect(composer.require['verbb/formie']).toBeUndefined();
		expect(composer['require-dev']['acme/dev-tool']).toBe('^2.0');
		expect(composer.autoload['psr-4']).toEqual({ 'Acme\\': 'src/' });
		expect(composer.scripts).toEqual({ test: 'php test.php' });
	});

	it('uses pinned optional frontend versions without Git history', () => {
		const root = tempProject();
		fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ devDependencies: {} }));
		updatePackageJson({ name: 'demo', description: '' }, { root, useCritical: true, hasIconManager: true });
		const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
		expect(pkg.devDependencies['rollup-plugin-critical']).toBe('^1.0.15');
		expect(pkg.devDependencies.svgo).toBe('^4.0.0');
	});

	it('switches Composer and frontend architecture for Craft 6', () => {
		const root = tempProject();
		fs.writeFileSync(
			path.join(root, 'composer.json'),
			JSON.stringify({
				require: { 'craftcms/cms': '^5', 'nystudio107/craft-vite': '^5' },
				'require-dev': { 'craftcms/generator': '^2' },
			}),
		);
		fs.writeFileSync(
			path.join(root, 'package.json'),
			JSON.stringify({ devDependencies: { vite: '^8', 'rollup-plugin-critical': '^1' } }),
		);
		const hosting = { value: 'none', packages: [] };
		updateComposer(
			{
				selectedLr: [],
				selectedTp: [],
				selectedHosting: hosting,
				useRedisCache: false,
				craftProfile: 'craft6',
				craftReleaseChannel: 'alpha',
			},
			{ root },
		);
		updatePackageJson({ name: 'demo', description: 'Demo' }, { root, craftProfile: 'craft6', useCritical: false });

		const composer = JSON.parse(fs.readFileSync(path.join(root, 'composer.json'), 'utf-8'));
		const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
		expect(composer.require).toMatchObject({
			'craftcms/cms': '^6.0.0-alpha.16',
			'laravel/framework': '^13.8',
		});
		expect(composer.require['nystudio107/craft-vite']).toBeUndefined();
		expect(composer.autoload['psr-4']).toMatchObject({ 'App\\': 'app/' });
		expect(composer.scripts['post-autoload-dump']).toContain('@php artisan craft:setup:publish --ansi');
		expect(pkg.devDependencies['laravel-vite-plugin']).toBe('^3.0.0');
		expect(pkg.devDependencies['rollup-plugin-critical']).toBeUndefined();
	});
});

describe('Craft install commands', () => {
	const project = {
		name: 'demo',
		description: 'Demo Site',
		adminEmail: 'admin@example.com',
		adminPassword: 'password123',
		language: 'en-US',
	};

	it('uses Symfony option names for Craft 6', () => {
		const command = buildCraftInstallCommand(project, { craftProfile: 'craft6' });
		expect(command).toContain('php craft install --no-interaction');
		expect(command).toContain('--siteName=');
		expect(command).toContain('--siteUrl=');
		expect(command).not.toContain('--site-name=');
	});
});

describe('generated DDEV sidecars', () => {
	function prepareDdevProject(sidecar) {
		const root = tempProject();
		const cliDir = path.join(root, 'cli');
		fs.mkdirSync(path.join(root, '.ddev'), { recursive: true });
		fs.mkdirSync(path.join(cliDir, 'templates/critical'), { recursive: true });
		fs.writeFileSync(
			path.join(root, '.ddev/config.yaml'),
			'name: starter\ntype: craftcms\ndocroot: web\ntimezone: UTC\nwebimage_extra_packages: []\nupload_dirs:\n    - web/assets\n    - storage\n',
		);
		fs.writeFileSync(path.join(cliDir, 'templates/critical/config.m1.yaml'), 'managed: true\n');
		fs.writeFileSync(path.join(root, '.ddev/config.m1.yaml'), sidecar);
		return { root, cliDir };
	}

	it('removes an unchanged generated sidecar when critical CSS is disabled', () => {
		const paths = prepareDdevProject('managed: true\n');
		expect(updateDdevConfig({ name: 'demo', timezone: 'UTC' }, { ...paths, useCritical: false })).toBeNull();
		expect(fs.existsSync(path.join(paths.root, '.ddev/config.m1.yaml'))).toBe(false);
	});

	it('applies the active profile DDEV layout', () => {
		const paths = prepareDdevProject('managed: true\n');
		updateDdevConfig({ name: 'demo', timezone: 'UTC' }, { ...paths, useCritical: true });
		const config = fs.readFileSync(path.join(paths.root, '.ddev/config.yaml'), 'utf-8');
		expect(config).toContain('type: craftcms');
		expect(config).toContain('docroot: web');
		expect(config).toContain('upload_dirs:\n    - web/assets\n    - storage\n');
	});

	it('applies the Craft 6 Laravel DDEV layout', () => {
		const paths = prepareDdevProject('managed: true\n');
		updateDdevConfig({ name: 'demo', timezone: 'UTC' }, { ...paths, useCritical: false, craftProfile: 'craft6' });
		const config = fs.readFileSync(path.join(paths.root, '.ddev/config.yaml'), 'utf-8');
		expect(config).toContain('type: laravel');
		expect(config).toContain('docroot: public');
		expect(config).toContain('upload_dirs:\n    - public/assets\n    - storage\n');
	});

	it('preserves a customized sidecar when critical CSS is disabled', () => {
		const paths = prepareDdevProject('custom: true\n');
		expect(updateDdevConfig({ name: 'demo', timezone: 'UTC' }, { ...paths, useCritical: false })).toBe(
			'.ddev/config.m1.yaml',
		);
		expect(fs.readFileSync(path.join(paths.root, '.ddev/config.m1.yaml'), 'utf-8')).toBe('custom: true\n');
	});
});

describe('profile-aware static assets', () => {
	it('copies rebrand assets to the active profile destination', () => {
		const root = tempProject();
		const cliDir = path.join(root, 'generator-cli');
		fs.mkdirSync(path.join(cliDir, 'templates/rebrand/logo'), { recursive: true });
		fs.writeFileSync(path.join(cliDir, 'templates/rebrand/logo/logo.svg'), '<svg/>');
		expect(syncRebrandAssets({ root, cliDir })).toBe(true);
		expect(fs.readFileSync(path.join(root, 'storage/rebrand/logo/logo.svg'), 'utf-8')).toBe('<svg/>');
	});
});

describe('translation scaffolding', () => {
	it('uses each unique exact Craft language ID', () => {
		const root = tempProject();
		scaffoldTranslations(
			[
				{ handle: 'english', language: 'en-US' },
				{ handle: 'corporate', language: 'en-US' },
				{ handle: 'arabic', language: 'ar' },
			],
			'messages',
			{ root },
		);
		expect(fs.existsSync(path.join(root, 'translations/en-US/messages.php'))).toBe(true);
		expect(fs.existsSync(path.join(root, 'translations/ar/messages.php'))).toBe(true);
		expect(fs.existsSync(path.join(root, 'translations/english'))).toBe(false);
	});

	it('preserves customized obsolete translation files', () => {
		const root = tempProject();
		fs.mkdirSync(path.join(root, 'translations/en-US'), { recursive: true });
		fs.writeFileSync(path.join(root, 'translations/en-US/site.php'), '<?php return ["custom" => "value"];\n');
		const preserved = cleanUnusedTranslations([], {
			root,
			previousSites: [{ language: 'en-US' }],
			previousCategory: 'site',
		});
		expect(preserved).toEqual(['translations/en-US/site.php']);
		expect(fs.existsSync(path.join(root, 'translations/en-US/site.php'))).toBe(true);
	});
});

describe('plugin edition plan', () => {
	const actual = { commerce: ['pro', 'enterprise'] };
	it('accepts an edition verified against the installed plugin class', () => {
		expect(() =>
			validatePluginEditions([{ handle: 'commerce', edition: 'pro' }], { inspector: () => actual }),
		).not.toThrow();
	});

	it('passes the selected edition positionally and disables installer prompts', () => {
		expect(pluginInstallArgs({ handle: 'search-manager', edition: 'pro' })).toEqual([
			'exec',
			'php',
			'craft',
			'plugin/install',
			'search-manager',
			'pro',
			'--interactive=0',
		]);
	});

	it('rejects missing or stale registry edition metadata', () => {
		expect(() => validatePluginEditions([{ handle: 'commerce' }], { inspector: () => actual })).toThrow(
			/no edition metadata/,
		);
		expect(() =>
			validatePluginEditions([{ handle: 'commerce', edition: 'lite' }], { inspector: () => actual }),
		).toThrow(/invalid/);
	});

	it('records every currently known multi-edition catalogue plugin', () => {
		const plugins = [...LR_PLUGINS, ...THIRD_PARTY_PLUGINS];
		expect(plugins.find(({ handle }) => handle === 'search-manager')?.editions.map(({ value }) => value)).toEqual([
			'standard',
			'pro',
		]);
		expect(plugins.find(({ handle }) => handle === 'commerce')?.editions.map(({ value }) => value)).toEqual([
			'pro',
			'enterprise',
		]);
		expect(plugins.find(({ handle }) => handle === 'freeform')?.editions.map(({ value }) => value)).toEqual([
			'express',
			'lite',
			'pro',
		]);
		expect(plugins.find(({ handle }) => handle === 'imager-x')?.editions.map(({ value }) => value)).toEqual([
			'lite',
			'pro',
		]);
	});
});

describe('generated plugin configuration', () => {
	it('preserves a customized config for a deselected plugin', () => {
		const root = tempProject();
		fs.mkdirSync(path.join(root, 'config'), { recursive: true });
		fs.writeFileSync(path.join(root, 'config/redirect-manager.php'), '<?php\nreturn ["custom" => true];\n');
		expect(cleanUnusedPluginConfigs(LR_PLUGINS, [], { root })).toEqual(['config/redirect-manager.php']);
		expect(fs.existsSync(path.join(root, 'config/redirect-manager.php'))).toBe(true);
	});
});
