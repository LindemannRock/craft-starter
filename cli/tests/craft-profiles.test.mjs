import { describe, expect, it } from 'vitest';
import {
	CRAFT_PROFILES,
	composerConfigForCraftProfile,
	craftManifestMetadata,
	craftProjectPath,
	resolveCraftProfile,
	resolveCraftRelease,
	resolvePluginForCraftProfile,
	validateCraftProfile,
} from '../config/craft-profiles.mjs';
import { promptCraftPlatform } from '../prompts/craft.mjs';

describe('Craft platform profiles', () => {
	it('enables only complete profiles', () => {
		expect(Object.keys(CRAFT_PROFILES)).toEqual(['craft5']);
		expect(resolveCraftProfile().id).toBe('craft5');
		expect(() => resolveCraftProfile(6)).toThrow(/Unsupported Craft profile/);
		expect(() => resolveCraftProfile({ profile: 'craft6', major: 5 })).toThrow(/Unsupported Craft profile/);
		expect(() => validateCraftProfile({ id: 'craft-x' })).toThrow(/Incomplete Craft profile/);
	});

	it('centralizes the Craft 5 architecture and dependencies', () => {
		const profile = resolveCraftProfile(5);
		expect(profile.ddev).toMatchObject({ projectType: 'craftcms', docroot: 'web' });
		expect(profile.database).toMatchObject({ default: 'mysql' });
		expect(profile.database.options.map(({ value }) => value)).toEqual(['mysql', 'postgres', 'postgres-16']);
		expect(profile.paths).toMatchObject({
			build: 'web/dist',
			templates: 'templates',
			generalConfig: 'config/general.php',
			projectConfig: 'config/project',
		});
		expect(profile.commands).toMatchObject({
			projectInstall: ['php', 'craft', 'install'],
			projectUp: ['php', 'craft', 'up', '--interactive=0'],
			projectConfigurator: ['php', 'cli/scripts/configure-project.php'],
		});
		expect(craftProjectPath('/project', 'build', profile)).toBe('/project/web/dist');
		expect(composerConfigForCraftProfile(profile).require['craftcms/cms']).toBe('^5.10.13');
	});

	it('keeps release channels independent from project architecture', () => {
		expect(craftManifestMetadata()).toEqual({ profile: 'craft5', major: 5, channel: 'stable' });
		expect(resolveCraftRelease('craft5').channel).toBe('stable');
		expect(() => resolveCraftRelease('craft5', 'alpha')).toThrow(/Unsupported Craft CMS 5 release channel/);
	});

	it('skips platform questions while only one complete option exists', async () => {
		await expect(promptCraftPlatform()).resolves.toMatchObject({
			profile: { id: 'craft5' },
			channel: 'stable',
		});
	});

	it('treats legacy plugin entries as Craft 5-only and applies profile overrides', () => {
		const legacy = { value: 'vendor/plugin', version: '^5.0' };
		expect(resolvePluginForCraftProfile(legacy, 5)).toEqual(legacy);

		const versioned = {
			...legacy,
			craft: { 5: { version: '^5.5', editions: [{ value: 'pro', label: 'Pro' }] } },
		};
		expect(resolvePluginForCraftProfile(versioned, 5)).toMatchObject({ version: '^5.5' });
	});
});
