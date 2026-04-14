/**
 * Redis prompt.
 *
 * Asks whether the user wants Redis-backed caching. When enabled:
 * - Adds yiisoft/yii2-redis to composer
 * - Installs the ddev/ddev-redis addon before ddev start
 * - Keeps Redis env vars in .env
 * - Craft's cache component uses Redis
 *
 * When disabled, Craft falls back to its default file-based cache.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';

export async function promptRedis() {
	const useRedis = await p.confirm({
		message: 'Use Redis for cache? (recommended for production)',
		initialValue: true,
	});
	if (p.isCancel(useRedis)) cancel();
	return useRedis;
}
