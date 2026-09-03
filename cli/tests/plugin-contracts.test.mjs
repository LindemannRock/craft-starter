import fs from 'fs';
import { describe, expect, it } from 'vitest';

const read = (relativePath) => fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf-8');

describe('managed plugin template contracts', () => {
	it('includes the released Logging Library runtime-store configuration', () => {
		const config = read('templates/plugins/logging-library.php');
		expect(config).toContain("'pluginName' => 'Logging Library'");
		expect(config).toContain("'runtimeLogStore' => [");
		expect(config).toContain("'forceEnableLogViewer' => false");
	});

	it('keeps removed Redirect Manager settings out of generated config', () => {
		const config = read('templates/plugins/redirect-manager.php');
		for (const obsolete of ['statisticsRetention', 'statisticsLimit', 'autoTrimStatistics', 'recordIp']) {
			expect(config).not.toContain(`'${obsolete}'`);
		}
		expect(config).toContain("'apiEndpointToken' => App::env('REDIRECT_MANAGER_API_TOKEN')");
		expect(config).toContain("'cacheStorageMethod' => 'craft'");
	});

	it('keeps Translation Manager aligned while preserving starter env choices', () => {
		const config = read('templates/plugins/translation-manager.php');
		for (const obsolete of ['autoExport', 'enableSuggestions', 'autoSaveDelay']) {
			expect(config).not.toContain(`'${obsolete}'`);
		}
		expect(config).toContain("'enableFreeformIntegration' => true");
		expect(config).toContain("'runtimeTranslationSource' => 'php-files'");
		expect(config).toContain("App::env('PRIMARY_TRANSLATION_CATEGORY')");
		expect(config).toContain("App::env('PRIMARY_SITE_LANGUAGE')");
	});

	it('does not reintroduce obsolete static API credentials', () => {
		const template = read('templates/env.example');
		expect(template).not.toMatch(/FORMIE_API_KEY(?:_LIMITED|_TEST)?=/);
		expect(template).not.toContain('FORMIE_SAP_');
		expect(template).not.toContain('OPENAI_API_KEY');
	});
});
