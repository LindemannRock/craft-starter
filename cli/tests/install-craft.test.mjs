import {describe, expect, it, vi} from 'vitest';
import {installCraft} from '../scripts/install-craft.mjs';

const manifest = {
	craft: {profile: 'craft6', channel: 'alpha'},
	project: {
		name: 'demo',
		description: 'Demo Site',
		adminEmail: 'admin@example.com',
		language: 'en',
	},
};

describe('first-run Craft installation', () => {
	it('prompts only for the unpersisted password and reuses manifest choices', async () => {
		const promptPassword = vi.fn().mockResolvedValue('a secure passphrase');
		const run = vi.fn().mockReturnValue(0);

		await expect(installCraft({manifest, promptPassword, run})).resolves.toBe(0);
		expect(promptPassword).toHaveBeenCalledOnce();
		expect(run).toHaveBeenCalledWith([
			'exec',
			'php',
			'craft',
			'install',
			'--no-interaction',
			'--email=admin@example.com',
			'--password=a secure passphrase',
			'--siteName=Demo Site',
			'--siteUrl=https://demo.ddev.site',
			'--language=en',
		]);
	});

	it('preserves the native interactive installer for older projects', async () => {
		const promptPassword = vi.fn();
		const run = vi.fn().mockReturnValue(0);

		await expect(installCraft({manifest: null, promptPassword, run})).resolves.toBe(0);
		expect(promptPassword).not.toHaveBeenCalled();
		expect(run).toHaveBeenCalledWith(['exec', 'php', 'craft', 'install']);
	});

	it('does not run the installer when the password prompt is cancelled', async () => {
		const run = vi.fn();
		const cancelled = Symbol('cancelled');
		await expect(
			installCraft({manifest, promptPassword: async () => cancelled, isCancelled: (value) => value === cancelled, run}),
		).resolves.toBe(130);
		expect(run).not.toHaveBeenCalled();
	});
});
