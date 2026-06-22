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
	},
	{
		value: 'postgres',
		label: 'PostgreSQL 16',
		hint: 'Popular open-source relational database',
		ddevType: 'postgres',
		ddevVersion: '16',
		craftDriver: 'pgsql',
		craftPort: '5432',
	},
];

export const DEFAULT_DATABASE = DATABASE_OPTIONS[0];

export function getDatabaseOption(value) {
	return DATABASE_OPTIONS.find((option) => option.value === value) || DEFAULT_DATABASE;
}
