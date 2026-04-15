/**
 * Presentation helpers for the CLI — intro, configuration summary, outro.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';

export function intro() {
	console.log('');
	p.intro(pc.bgCyan(pc.black(' LindemannRock — Craft CMS Starter ')));
}

export function showConfigurationSummary({ project, sites, useRedis, useCritical, selectedLr, selectedTp, selectedHosting }) {
	const rows = [
		['Project', project.name],
		['Site name', project.description],
		['Timezone', project.timezone],
		['Language', project.language],
		['CP trigger', `/${project.cpTrigger || 'cms'}`],
		['Week starts', project.weekStartDay === 0 ? 'Sunday' : 'Monday'],
		['Admin', project.adminEmail],
		['System email', project.systemEmail],
		['Sites', sites.map((s) => `${s.handle} (${s.language})`).join(', ')],
		['Cache', useRedis ? 'Redis' : 'File (default)'],
		['Critical CSS', useCritical ? 'Yes (run make critical)' : 'No'],
		['LR Plugins', selectedLr.length ? selectedLr.map((pl) => pl.autoAdded ? `${pl.label} (req. by ${pl.autoAdded})` : pl.label).join(', ') : 'None'],
		['Plugins', selectedTp.length ? selectedTp.map((pl) => pl.autoAdded ? `${pl.label} (req. by ${pl.autoAdded})` : pl.label).join(', ') : 'None'],
		['Hosting', selectedHosting.label],
	];

	// Pad each label to the width of the longest so all values line up
	const labelWidth = Math.max(...rows.map(([label]) => label.length));
	const labelGap = 2;
	const indentLength = labelWidth + labelGap;
	const indent = ' '.repeat(indentLength);

	// Box overhead: clack's note draws borders + padding, and there's an outer
	// "│  " prefix on every clack block. ~10 chars of overhead total.
	const terminalWidth = process.stdout.columns || 80;
	const boxOverhead = 10;
	// Cap between 30 (narrow terminals) and 80 (so it's never absurdly wide)
	const valueWidth = Math.max(30, Math.min(80, terminalWidth - boxOverhead - indentLength));

	p.note(
		rows.map(([label, value]) => {
			const wrapped = wrapValue(value, valueWidth, indent);
			return `${pc.bold(label.padEnd(labelWidth))}  ${wrapped}`;
		}).join('\n'),
		'Configuration',
	);
}

/**
 * Wrap a value so no line exceeds maxWidth. Breaks at commas first (for
 * plugin lists), then at spaces as fallback. Continuation lines are prefixed
 * with `indent` so they align under the value column.
 */
function wrapValue(value, maxWidth, indent) {
	if (value.length <= maxWidth) return value;

	// Prefer comma breaks for plugin lists
	if (value.includes(', ')) {
		const parts = value.split(', ');
		const lines = [];
		let current = '';
		for (let i = 0; i < parts.length; i++) {
			const piece = parts[i] + (i < parts.length - 1 ? ',' : '');
			const candidate = current ? `${current} ${piece}` : piece;
			if (candidate.length <= maxWidth) {
				current = candidate;
			} else {
				if (current) lines.push(current);
				current = piece;
			}
		}
		if (current) lines.push(current);
		return lines.join(`\n${indent}`);
	}

	// Fallback: break on spaces
	const words = value.split(' ');
	const lines = [];
	let current = '';
	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length <= maxWidth) {
			current = candidate;
		} else {
			if (current) lines.push(current);
			current = word;
		}
	}
	if (current) lines.push(current);
	return lines.join(`\n${indent}`);
}

export function outro({ project, useCritical }) {
	const siteUrl = `https://${project.name}.ddev.site`;
	const cpUrl = `${siteUrl}/${project.cpTrigger || 'cms'}`;

	const criticalLine = useCritical
		? `  ${pc.bold('make critical')}  Production build + critical CSS (slow)\n`
		: '';

	console.log('');
	p.outro(
		pc.green(pc.bold('Project ready!')) + '\n\n' +
		`  ${pc.bold('Site')}     ${pc.cyan(siteUrl)}\n` +
		`  ${pc.bold('Admin')}    ${pc.cyan(cpUrl)}\n` +
		`  ${pc.bold('Login')}    ${project.adminEmail}\n\n` +
		`  ${pc.dim('Common commands:')}\n` +
		`  ${pc.bold('make dev')}       Start Vite dev server (HMR)\n` +
		`  ${pc.bold('make prod')}      Production build (fast)\n` +
		criticalLine +
		`  ${pc.bold('make install')}   Re-sync project (idempotent)\n` +
		`  ${pc.bold('make reset')}     Wipe DB + .env, re-run setup\n` +
		`  ${pc.bold('make help')}      See all available commands\n`
	);
}
