/**
 * Critical CSS prompt.
 *
 * Asks whether the user wants above-the-fold CSS generated for their templates.
 * When enabled:
 * - Keeps rollup-plugin-critical in devDependencies
 * - Keeps the critical() block in vite.config.mjs active
 * - Sets GENERATE_CRITICAL_CSS=true in .env (consumed by vite.config.mjs)
 * - Exposes `make critical` for explicit generation (make prod stays fast)
 *
 * When disabled:
 * - rollup-plugin-critical is removed from devDependencies
 * - The critical() block is never executed (env var absent/false)
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { cancel } from '../utils/cancel.mjs';

export async function promptCritical() {
	const useCritical = await p.confirm({
		message: 'Generate critical CSS? (above-the-fold CSS for faster first paint — adds ~7s to builds)',
		initialValue: true,
	});
	if (p.isCancel(useCritical)) cancel();
	return useCritical;
}
