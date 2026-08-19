/**
 * PHP versions supported by the generated Craft 5 project.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

export const DEFAULT_PHP_VERSION = '8.3';

export const PHP_VERSION_OPTIONS = [
	{ value: '8.5', label: '8.5', hint: 'latest stable' },
	{ value: '8.4', label: '8.4', hint: 'supported by Craft 5.9+' },
	{ value: '8.3', label: '8.3', hint: 'starter default' },
	{ value: '8.2', label: '8.2', hint: 'Craft 5 minimum' },
];

export const SUPPORTED_PHP_VERSIONS = PHP_VERSION_OPTIONS.map(({ value }) => value);
