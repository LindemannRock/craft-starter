import { describe, expect, it, vi } from 'vitest';
import { updateDatabaseConfig } from '../actions/ddev.mjs';
import { getDatabaseOption } from '../config/databases.mjs';
import {
	isDdevDescriptionReady,
	isDdevProjectReady,
	parseDdevDescription,
} from '../utils/ddev.mjs';

describe('updateDatabaseConfig', () => {
	const config = [
		'name: craft-starter',
		'type: craftcms',
		'database:',
		'    # Craft 5 requires: MySQL 8.0.36+, MariaDB 10.4.6+, or PostgreSQL 16+.',
		'    type: mysql',
		'    version: "8.0"',
		'webimage_extra_packages: [build-essential]',
		'',
	].join('\n');

	it('updates only the database type and version', () => {
		const result = updateDatabaseConfig(config, getDatabaseOption('postgres-16'));

		expect(result).toContain('type: craftcms');
		expect(result).toContain('database:\n    # Craft 5 requires');
		expect(result).toContain('    type: postgres\n    version: "16"');
		expect(result).toContain('webimage_extra_packages: [build-essential]');
	});
});

function description({ project = 'running', web = 'running', db = 'running', xhgui = 'stopped' } = {}) {
	return {
		level: 'info',
		raw: {
			status: project,
			services: {
				web: { status: web },
				db: { status: db },
				xhgui: { status: xhgui },
			},
		},
	};
}

describe('DDEV project readiness', () => {
	it('accepts a running project when an optional XHGui service is stopped', () => {
		expect(isDdevDescriptionReady(description())).toBe(true);
	});

	it('parses stdout even when ddev describe exits nonzero', () => {
		const runner = vi.fn(() => {
			const error = new Error('Command failed with exit code 1');
			error.status = 1;
			error.stdout = JSON.stringify(description());
			throw error;
		});

		expect(isDdevProjectReady({ cwd: '/project', runner })).toBe(true);
		expect(runner).toHaveBeenCalledWith(
			'ddev',
			['describe', '--json-output'],
			expect.objectContaining({ cwd: '/project', encoding: 'utf-8' }),
		);
	});

	it('rejects stopped projects and stopped web services', () => {
		expect(isDdevDescriptionReady(description({ project: 'stopped', web: 'stopped' }))).toBe(false);
		expect(isDdevDescriptionReady(description({ web: 'stopped' }))).toBe(false);
	});

	it('fails closed for missing or malformed JSON', () => {
		expect(parseDdevDescription('not json')).toBeNull();
		expect(isDdevProjectReady({ runner: () => '' })).toBe(false);
	});
});
