/**
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';

/**
 * Cancel the setup cleanly with a message and non-zero exit.
 * Used by prompt onCancel handlers and caught promise rejections.
 */
export function cancel(message = 'Setup cancelled.') {
	p.cancel(message);
	process.exit(0);
}
