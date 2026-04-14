/**
 * Servd email transport prompt.
 *
 * Servd doesn't support Sendmail, so if the user picks Servd hosting without
 * Postmark, they need to choose an alternative email transport. This prompt
 * offers Postmark (auto-adds the plugin), Servd SMTP, or skip.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';
import { promptPostmarkToken } from './postmark.mjs';
import { THIRD_PARTY_PLUGINS } from '../config/plugins.mjs';

/**
 * @returns {Promise<{
 *   type: 'postmark' | 'smtp' | 'skip',
 *   postmarkToken?: string | null,
 *   postmarkPlugin?: object,
 *   smtp?: { host: string, port: string, username: string, password: string, useAuth: boolean },
 * }>}
 *
 */
export async function promptServdEmail() {
	p.log.info('Servd does not support Sendmail.\n' +
		'Choose an email transport for password resets,\n' +
		'form notifications, etc.');

	const choice = await p.select({
		message: 'How should Craft send email?',
		options: [
			{ value: 'postmark', label: 'Postmark (recommended)', hint: 'Add Postmark plugin + token' },
			{ value: 'smtp', label: 'Servd SMTP (or other SMTP)', hint: 'Enter SMTP credentials' },
			{ value: 'skip', label: 'Skip — configure manually later' },
		],
		initialValue: 'postmark',
	});
	if (p.isCancel(choice)) cancel();

	if (choice === 'postmark') {
		// Auto-add the Postmark plugin to the selection
		const postmarkPlugin = THIRD_PARTY_PLUGINS.find((pl) => pl.handle === 'postmark');
		const postmarkToken = await promptPostmarkToken();
		return { type: 'postmark', postmarkToken, postmarkPlugin };
	}

	if (choice === 'smtp') {
		const smtp = await p.group(
			{
				host: () =>
					p.text({
						message: 'SMTP hostname',
						placeholder: 'smtp.servd.host',
						validate: (v) => {
							if (!v) return 'SMTP hostname is required';
						},
					}),
				port: () =>
					p.text({
						message: 'SMTP port',
						placeholder: '587',
						initialValue: '587',
						validate: (v) => {
							if (!v) return 'SMTP port is required';
							if (!/^\d+$/.test(v)) return 'Port must be a number';
							const n = Number(v);
							if (n < 1 || n > 65535) return 'Port must be between 1 and 65535';
						},
					}),
				username: () =>
					p.text({
						message: 'SMTP username',
						validate: (v) => {
							if (!v) return 'SMTP username is required';
						},
					}),
				password: () =>
					p.password({
						message: 'SMTP password',
						validate: (v) => {
							if (!v) return 'SMTP password is required';
						},
					}),
			},
			{ onCancel: () => cancel() },
		);
		return { type: 'smtp', smtp: { ...smtp, useAuth: true } };
	}

	// Skip
	p.log.warn('Email transport skipped. Configure SMTP or Postmark manually in .env after install.');
	return { type: 'skip' };
}
