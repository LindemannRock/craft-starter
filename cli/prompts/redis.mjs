/**
 * Redis prompts.
 *
 * Asks whether the user wants Redis-backed caching, and if so, whether to
 * also use Redis for PHP sessions. Each feature uses a separate Redis database
 * index to prevent data collisions (see config/app.php header for the full map).
 *
 * When disabled, Craft falls back to its default file-based cache and
 * DB-backed sessions.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';

export async function promptRedis() {
	const useRedisCache = await p.confirm({
		message: 'Use Redis for cache? (recommended for production)',
		initialValue: true,
	});
	if (p.isCancel(useRedisCache)) cancel();

	let useRedisSession = false;
	if (useRedisCache) {
		useRedisSession = await p.confirm({
			message: 'Also use Redis for sessions?',
			initialValue: false,
		});
		if (p.isCancel(useRedisSession)) cancel();
	}

	return { useRedisCache, useRedisSession };
}
