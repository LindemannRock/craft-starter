#!/usr/bin/env node

import * as p from '@clack/prompts';
import pc from 'picocolors';
import {resetStarterScaffold} from '../actions/lifecycle.mjs';
import {readSetupManifest} from '../actions/setupManifest.mjs';

const action = process.argv[2];
const definitions = {
	reset: {
		message: 'Restore the committed starter scaffold and delete all generated project state?',
		run: resetStarterScaffold,
		done: 'Starter restored. Run `make create` to generate a new project.',
	},
};

const definition = definitions[action];
if (!definition) {
	console.error(`Unknown lifecycle action: ${action || '(missing)'}`);
	process.exit(1);
}

p.intro(pc.bgRed(pc.white(` ${action} `)));
const confirmed = await p.confirm({message: definition.message, initialValue: false});
if (p.isCancel(confirmed) || !confirmed) {
	p.outro('Cancelled.');
	process.exit(0);
}

try {
	const manifest = readSetupManifest();
	definition.run({craftProfile: manifest?.craft});
	p.outro(pc.green(definition.done));
} catch (error) {
	p.outro(pc.red(error.message));
	process.exit(1);
}
