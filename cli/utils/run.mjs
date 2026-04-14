/**
 * Async shell command runner.
 *
 * Captures stdout/stderr and only prints them on failure, so the clack spinner
 * stays clean during normal runs. Throws on failure so the caller can stop
 * spinners and clean up before exiting.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import { spawn } from 'child_process';
import { ROOT } from '../paths.mjs';

export function run(cmd) {
	return new Promise((resolve, reject) => {
		const child = spawn('sh', ['-c', cmd], {
			cwd: ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		child.stdout.on('data', (data) => { stdout += data; });
		child.stderr.on('data', (data) => { stderr += data; });

		child.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				if (stdout) console.log(stdout);
				if (stderr) console.error(stderr);
				reject(new Error(`Command failed: ${cmd}`));
			}
		});

		child.on('error', (err) => {
			reject(new Error(`Failed to run: ${cmd}\n${err.message}`));
		});
	});
}
