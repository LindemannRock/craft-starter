/**
 * Preflight checks — make sure the machine can actually run the installer.
 *
 * Runs before any prompts so users with missing prerequisites get a clean,
 * actionable error instead of a cryptic shell failure halfway through the
 * install pipeline.
 *
 * Checks (in order):
 *   1. Node version (we already ran, so we just compare)
 *   2. Docker installed
 *   3. Docker daemon running
 *   4. DDEV installed
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import { execSync } from 'child_process';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { ROOT } from '../paths.mjs';

const MIN_NODE_MAJOR = 22;

export function checkPrerequisites() {
	const problems = [];

	// -- Node version --------------------------------------------------------
	const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
	if (nodeMajor < MIN_NODE_MAJOR) {
		problems.push({
			name: `Node.js ${MIN_NODE_MAJOR}+ required`,
			detail: `You're running Node ${process.versions.node}`,
			fix: 'Install from https://nodejs.org/ or use nvm: `nvm install 22 && nvm use 22`',
		});
	}

	// -- Docker --------------------------------------------------------------
	if (!commandExists('docker')) {
		problems.push({
			name: 'Docker is not installed',
			detail: 'DDEV needs Docker to run the project containers',
			fix: 'macOS / Windows: https://www.docker.com/products/docker-desktop\nLinux: https://docs.docker.com/engine/install/',
		});
	} else if (!dockerDaemonRunning()) {
		problems.push({
			name: 'Docker is installed but not running',
			detail: "The Docker daemon isn't responding",
			fix: 'Start Docker Desktop (macOS/Windows) or run `sudo systemctl start docker` (Linux)',
		});
	}

	// -- DDEV ----------------------------------------------------------------
	if (!commandExists('ddev')) {
		problems.push({
			name: 'DDEV is not installed',
			detail: 'The starter uses DDEV for local development',
			fix: 'Install: https://ddev.com/quickstart/\nmacOS: `brew install ddev/ddev/ddev`',
		});
	}

	if (problems.length === 0) return;

	// -- Report and exit -----------------------------------------------------
	console.log('');
	p.log.error(pc.bold('Prerequisites missing — cannot continue:'));

	for (const problem of problems) {
		console.log('');
		console.log(`  ${pc.red('✗')} ${pc.bold(problem.name)}`);
		console.log(`    ${pc.dim(problem.detail)}`);
		for (const line of problem.fix.split('\n')) {
			console.log(`    ${pc.cyan(line)}`);
		}
	}

	console.log('');
	p.outro(pc.red('Install the missing prerequisites and run `make create` again.'));
	process.exit(1);
}

/**
 * Check if a command exists on the user's PATH.
 * Uses `command -v` which is POSIX-compliant (works on macOS and Linux).
 *
 */
function commandExists(cmd) {
	try {
		execSync(`command -v ${cmd}`, { stdio: 'ignore', shell: '/bin/sh' });
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if the Docker daemon is actually running (not just installed).
 * `docker info` fails silently if the daemon is down, even when the CLI exists.
 *
 */
function dockerDaemonRunning() {
	try {
		execSync('docker info', { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

/**
 * Light check for interactive picker scripts (update.mjs, db.mjs, etc.)
 * that need a running DDEV project. Prints a helpful message and exits
 * if the project isn't ready — avoids cryptic Docker/DDEV errors.
 *
 * Call at the top of any picker that runs `ddev exec` commands.
 */
export function requireProject() {
	if (!fs.existsSync(`${ROOT}/.env`)) {
		p.log.error('No .env file found. Run ' + pc.bold('make create') + ' first.');
		process.exit(0);
	}

	try {
		execSync('ddev describe', { cwd: ROOT, stdio: 'ignore' });
	} catch {
		p.log.error('DDEV is not running. Run ' + pc.bold('make start') + ' or ' + pc.bold('ddev start') + ' first.');
		process.exit(0);
	}
}
