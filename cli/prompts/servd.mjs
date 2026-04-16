/**
 * Servd-specific credentials prompt.
 * Only shown when Servd is selected as the hosting provider.
 *
 * Supports a "skip for now" path for users who haven't provisioned their Servd
 * project yet — scaffolds .env with TODO placeholders they can fill in later.
 * Run `make verify` to list any unfilled placeholders before deploy.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';

export async function promptServdCredentials() {
	p.log.info('Servd credentials live in: https://app.servd.host → Project Settings → Assets');

	const haveCredentials = await p.select({
		message: 'Do you have your Servd credentials now?',
		options: [
			{ value: 'yes',  label: 'Yes, enter them now' },
			{ value: 'skip', label: 'No, scaffold .env with placeholders', hint: 'I\'ll fill them in later — run make verify to check' },
		],
	});
	if (p.isCancel(haveCredentials)) cancel();

	// Skip path — return a credentials object flagged as placeholder so env.mjs
	// can render TODO comments instead of real values.
	if (haveCredentials === 'skip') {
		p.log.warn('Servd env vars will be scaffolded as placeholders. Run ' + 'make verify' + ' before deploy to catch unfilled values.');
		return { placeholder: true };
	}

	const credentials = await p.group(
		{
			slug: () =>
				p.text({
					message: 'Servd Project Slug',
					placeholder: 'my-project-slug',
					validate: (v) => {
						if (!v) return 'Project slug is required for Servd';
					},
				}),
			key: () =>
				p.password({
					message: 'Servd Security Key',
					validate: (v) => {
						if (!v) return 'Security key is required for Servd';
					},
				}),
		},
		{ onCancel: () => cancel() },
	);

	const useCustomDomains = await p.confirm({
		message: 'Custom asset domains?',
		initialValue: false,
	});
	if (p.isCancel(useCustomDomains)) cancel();

	if (useCustomDomains) {
		const domains = await p.group(
			{
				cdnUrl: () =>
					p.text({
						message: 'CDN URL pattern',
						placeholder: 'https://media.example.com/{{environment}}/{{subfolder}}/{{filePath}}',
						validate: (v) => {
							if (!v) return 'CDN URL pattern is required';
						},
					}),
				imageTransformUrl: () =>
					p.text({
						message: 'Image transform URL pattern',
						placeholder: 'https://images.example.com/{{environment}}/{{subfolder}}/{{filePath}}{{params}}',
						validate: (v) => {
							if (!v) return 'Image transform URL pattern is required';
						},
					}),
			},
			{ onCancel: () => cancel() },
		);
		credentials.cdnUrl = domains.cdnUrl;
		credentials.imageTransformUrl = domains.imageTransformUrl;
	}

	return credentials;
}
