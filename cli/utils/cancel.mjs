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

/**
 * Narrow an error from `@inquirer/*` prompts: was it a real user cancel
 * (Ctrl-C / Esc), or a bug that needs to surface?
 *
 * Use as a `.catch(isPromptCancel(cancel))` helper so real errors aren't
 * silently swallowed as "user pressed cancel".
 */
export function isPromptCancel(err) {
	if (!err) return false;
	// @inquirer/core throws ExitPromptError on Ctrl-C
	if (err.name === 'ExitPromptError') return true;
	// Older versions / edge cases
	if (typeof err.message === 'string' && /user force closed|prompt was canceled/i.test(err.message)) return true;
	return false;
}
