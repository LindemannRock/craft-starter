#!/usr/bin/env node

/** First-run Craft installer used by `make install` and runtime repair. */

import path from 'path';
import {fileURLToPath} from 'url';
import {spawnSync} from 'child_process';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {buildCraftInstallArgs} from '../actions/install.mjs';
import {readSetupManifest} from '../actions/setupManifest.mjs';
import {resolveCraftProfile} from '../config/craft-profiles.mjs';

function runDdev(args) {
	const result = spawnSync('ddev', args, {stdio: 'inherit'});
	if (result.error) throw result.error;
	return result.status ?? 1;
}

export async function installCraft({
	manifest = readSetupManifest(),
	promptPassword = () =>
		p.password({
			message: 'Admin password (minimum 10 chars — use a passphrase)',
			validate: (value) => {
				if (!value || value.length < 10) return 'Password must be at least 10 characters';
			},
		}),
	isCancelled = p.isCancel,
	run = runDdev,
} = {}) {
	const profile = resolveCraftProfile(manifest?.craft);

	// Projects created before the setup manifest was introduced still get the
	// framework's native interactive installer instead of being blocked.
	if (!manifest?.project?.name || !manifest.project.adminEmail || !manifest.project.language) {
		console.log('No complete starter manifest found — opening the Craft installer.');
		return run(['exec', ...profile.commands.projectInstall]);
	}

	console.log(`Installing ${manifest.project.description || manifest.project.name} for ${manifest.project.adminEmail}`);
	const password = await promptPassword();
	if (isCancelled(password)) return 130;

	const args = buildCraftInstallArgs({...manifest.project, adminPassword: password}, {craftProfile: profile});
	return run(['exec', ...args]);
}

async function main() {
	const status = await installCraft();
	if (status === 130) {
		p.outro(pc.yellow('Installation cancelled.'));
	}
	process.exit(status);
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
	main().catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
}
