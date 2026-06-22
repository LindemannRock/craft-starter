/**
 * Database engines supported by the interactive starter.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

export const DATABASE_OPTIONS = [
	{
		value: 'mysql',
		label: 'MySQL 8.0',
		hint: 'Default for most Craft projects',
		ddevType: 'mysql',
		ddevVersion: '8.0',
		craftDriver: 'mysql',
		craftPort: '3306',
		craftSchema: '',
	},
	{
		value: 'postgres',
		label: 'PostgreSQL 18',
		hint: 'Latest stable PostgreSQL',
		ddevType: 'postgres',
		ddevVersion: '18',
		craftDriver: 'pgsql',
		craftPort: '5432',
		craftSchema: 'public',
	},
	{
		value: 'postgres-16',
		label: 'PostgreSQL 16',
		hint: 'Craft 5 baseline',
		ddevType: 'postgres',
		ddevVersion: '16',
		craftDriver: 'pgsql',
		craftPort: '5432',
		craftSchema: 'public',
	},
];

export const DEFAULT_DATABASE = DATABASE_OPTIONS[0];

export function getDatabaseOption(value) {
	return DATABASE_OPTIONS.find((option) => option.value === value) || DEFAULT_DATABASE;
}
