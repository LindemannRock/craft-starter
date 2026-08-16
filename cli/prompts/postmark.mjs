/**
 * Postmark-specific credentials prompt.
 * Only shown when Postmark is selected as a plugin.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';

export async function promptPostmarkToken({ required = false } = {}) {
	p.log.info('Postmark needs a Server API Token for staging/production.\n' +
		'Get it from: https://account.postmarkapp.com\n' +
		'→ Servers → (your server) → API Tokens' +
		(required ? '.' : '\nLeave blank to skip (local dev uses Mailpit).'));

	const token = await p.password({
		message: `Postmark Server API Token${required ? '' : ' (optional)'}`,
		validate: (value) => {
			if (required && !value) return 'A Postmark token is required for the selected production transport';
		},
	});

	if (p.isCancel(token)) cancel();
	return token || null;
}
