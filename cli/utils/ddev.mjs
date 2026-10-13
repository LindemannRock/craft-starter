/**
 * DDEV project readiness checks.
 *
 * `ddev describe` can exit nonzero when an optional service is stopped even
 * while the project and its web service are running. Always parse the JSON
 * payload, including stdout attached to a failed child process.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import { execFileSync } from 'child_process';
import { ROOT } from '../paths.mjs';

export function parseDdevDescription(output) {
	const text = Buffer.isBuffer(output) ? output.toString('utf-8') : String(output || '');
	const trimmed = text.trim();
	if (!trimmed) return null;

	try {
		return JSON.parse(trimmed);
	} catch {
		// Be defensive if DDEV or a wrapper writes a notice before the JSON line.
		for (const line of trimmed.split('\n').reverse()) {
			try {
				return JSON.parse(line);
			} catch {
				// Continue looking for the JSON payload.
			}
		}
	}

	return null;
}

export function isDdevDescriptionReady(description) {
	return description?.raw?.status === 'running' && description?.raw?.services?.web?.status === 'running';
}

export function isDdevProjectReady({ cwd = ROOT, runner = execFileSync } = {}) {
	let output = '';

	try {
		output = runner('ddev', ['describe', '--json-output'], {
			cwd,
			encoding: 'utf-8',
			stdio: ['ignore', 'pipe', 'pipe'],
		});
	} catch (error) {
		output = error?.stdout || '';
	}

	return isDdevDescriptionReady(parseDdevDescription(output));
}
