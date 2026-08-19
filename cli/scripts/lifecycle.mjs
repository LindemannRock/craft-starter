#!/usr/bin/env node

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { nukeRuntime, resetProject, resetStarterScaffold } from '../actions/lifecycle.mjs';

const action = process.argv[2];
const definitions = {
	nuke: {
		message: 'Remove DDEV/database, vendor, node_modules, build output and runtime caches?',
		run: nukeRuntime,
		done: 'Local runtime removed. Run `make install` to rebuild it.',
	},
	reset: {
		message: 'Delete the local database, .env, generated Project Config and incomplete recovery state?',
		run: resetProject,
		done: 'Project reset. Run `make create` to configure it again.',
	},
	'starter-reset': {
		message: 'Restore the original starter scaffold and delete all generated project state?',
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
const confirmed = await p.confirm({ message: definition.message, initialValue: false });
if (p.isCancel(confirmed) || !confirmed) {
	p.outro('Cancelled.');
	process.exit(0);
}

try {
	definition.run();
	p.outro(pc.green(definition.done));
} catch (error) {
	p.outro(pc.red(error.message));
	process.exit(1);
}
