import { describe, it, expect } from 'vitest';
import { updateDatabaseConfig } from '../actions/ddev.mjs';
import { getDatabaseOption } from '../config/databases.mjs';

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
