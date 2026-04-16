/**
 * Async shell command runner.
 *
 * Captures stdout/stderr and only prints them on failure, so the clack spinner
 * stays clean during normal runs. Throws on failure so the caller can stop
 * spinners and clean up before exiting.
 *
 * Secrets are redacted from error messages and stdout/stderr to avoid leaking
 * admin passwords / API tokens into terminals, screenshots, CI logs.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import { spawn } from 'child_process';
import { ROOT } from '../paths.mjs';

// Flags whose values are secret-like and should be masked in error output.
// Matches both short (`--password=secret`, `--token=abc`) and space-separated
// (`--password 'secret'`) forms, quoted or unquoted.
const SECRET_FLAGS = ['--password', '--token', '--secret', '--api-key', '--key'];

function redactSecrets(text) {
	let redacted = String(text);
	for (const flag of SECRET_FLAGS) {
		// --flag=value or --flag='value' or --flag="value"
		redacted = redacted.replace(
			new RegExp(`(${flag}=)(?:'[^']*'|"[^"]*"|\\S+)`, 'gi'),
			'$1***',
		);
		// --flag value (space-separated)
		redacted = redacted.replace(
			new RegExp(`(${flag})\\s+(?:'[^']*'|"[^"]*"|\\S+)`, 'gi'),
			'$1 ***',
		);
	}
	return redacted;
}

// Default ceiling — long enough for `ddev start` (image pulls on first run)
// and `composer install` but catches true hangs (Docker socket dead, etc.).
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function run(cmd, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn('sh', ['-c', cmd], {
			cwd: ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';
		let timedOut = false;

		const timer = setTimeout(() => {
			timedOut = true;
			child.kill('SIGTERM');
			// Escalate to SIGKILL if the process doesn't respect SIGTERM in 5s
			setTimeout(() => child.kill('SIGKILL'), 5000);
		}, timeoutMs);

		child.stdout.on('data', (data) => { stdout += data; });
		child.stderr.on('data', (data) => { stderr += data; });

		child.on('close', (code) => {
			clearTimeout(timer);
			if (timedOut) {
				const mins = Math.round(timeoutMs / 60000);
				reject(new Error(`Command timed out after ${mins} minute${mins === 1 ? '' : 's'}: ${redactSecrets(cmd)}`));
				return;
			}
			if (code === 0) {
				resolve();
			} else {
				if (stdout) console.log(redactSecrets(stdout));
				if (stderr) console.error(redactSecrets(stderr));
				reject(new Error(`Command failed: ${redactSecrets(cmd)}`));
			}
		});

		child.on('error', (err) => {
			clearTimeout(timer);
			reject(new Error(`Failed to run: ${redactSecrets(cmd)}\n${err.message}`));
		});
	});
}
