/**
 * Servd-specific credentials prompt.
 * Only shown when Servd is selected as the hosting provider.
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';

export async function promptServdCredentials() {
	p.note(
		'Servd requires a Project Slug and Security Key for local development.\n' +
		'Get them from: https://app.servd.host → Project Settings → Assets',
		'Servd credentials',
	);

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
