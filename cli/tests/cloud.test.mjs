import fs from 'fs';
import path from 'path';
import {describe, expect, it} from 'vitest';
import {fileURLToPath} from 'url';
import {applyCraftCloudDefaults, craftCloudConfig} from '../actions/cloud.mjs';
import {HOSTING_OPTIONS} from '../config/plugins.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Craft Cloud scaffolding', () => {
	it('uses the PHP version selected for the project', () => {
		expect(craftCloudConfig('8.2')).toBe("php-version: '8.2'\nnode-version: '22'\nnpm-script: build\n");
	});

	it('uses a stable Cloud extension constraint without treating it as a Craft plugin', () => {
		const cloud = HOSTING_OPTIONS.find((option) => option.value === 'craft-cloud');
		expect(cloud.packages).toEqual([{name: 'craftcms/cloud', version: '^3.11.0', handle: null}]);
	});

	it('disables Nginx SSI critical CSS and committed build output on Cloud', () => {
		const state = {
			selectedHosting: {value: 'craft-cloud'},
			useCritical: true,
			commitBuildFiles: true,
		};

		const notices = applyCraftCloudDefaults(state);

		expect(state.useCritical).toBe(false);
		expect(state.commitBuildFiles).toBe(false);
		expect(notices).toHaveLength(2);
	});

	it('does not alter choices for other hosts', () => {
		const state = {
			selectedHosting: {value: 'servd'},
			useCritical: true,
			commitBuildFiles: true,
		};

		expect(applyCraftCloudDefaults(state)).toEqual([]);
		expect(state.useCritical).toBe(true);
		expect(state.commitBuildFiles).toBe(true);
	});
});

describe('Cloud-safe project templates', () => {
	it('does not render a synchronous CSRF token in the base layout', () => {
		const layout = fs.readFileSync(path.join(root, 'templates/_boilerplate/_layouts/base-html-layout.twig'), 'utf8');
		expect(layout).not.toContain('request.csrfToken');
	});

	it('uses artifact URLs for control-panel build assets', () => {
		const config = fs.readFileSync(path.join(root, 'config/general.php'), 'utf8');
		expect(config).toContain("App::env('CRAFT_CLOUD_ARTIFACT_BASE_URL')");
		expect(config).toContain("App::env('CRAFT_CLOUD_ENVIRONMENT_ID')");
		expect(config).toContain("App::env('CRAFT_CLOUD_BUILD_ID')");
		expect(config).toContain("App::env('CRAFT_CLOUD_CDN_BASE_URL')");
		expect(config).not.toContain('CloudHelper::artifactUrl');
		expect(config).not.toContain("'href' => '/dist/");
	});

	it('falls back to the bootstrapped Cloud helper for template artifact URLs', () => {
		const globals = fs.readFileSync(path.join(root, 'templates/_layouts/global-variables.twig'), 'utf8');
		expect(globals).toContain("getenv('CRAFT_CLOUD_ARTIFACT_BASE_URL')");
		expect(globals).toContain('cloud is defined');
		expect(globals).toContain('cloud.artifactUrl()');
	});

	it('keeps the tracked rebrand path environment-configurable', () => {
		const envTemplate = fs.readFileSync(path.join(root, 'cli/templates/env.example'), 'utf8');
		expect(envTemplate).toContain('CRAFT_REBRAND_PATH=@root/storage/rebrand');
	});
});
