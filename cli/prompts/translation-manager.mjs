/**
 * Translation Manager prompts.
 * Asks for the translation category name used in Twig templates.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';

export async function promptTranslationCategory() {
	p.log.info('Translation Manager uses a category name for translations.\n' +
		'This maps to filenames in translations/{lang}/{category}.php\n' +
		'and is used in Twig: {{ "Hello"|t("site") }}');

	const category = await p.text({
		message: 'Translation category',
		placeholder: 'site',
		initialValue: 'site',
		validate: (v) => {
			if (!v) return 'Category name is required';
			if (!/^[a-z0-9-]+$/.test(v)) return 'Use lowercase letters, numbers, and hyphens only';
		},
	});
	if (p.isCancel(category)) cancel();
	return category;
}
