/**
 * Local/private-IP analytics fallback locations supported by LR managers.
 *
 * A generated project uses one shared fallback across every selected manager.
 * The prompt therefore exposes only locations supported by all of them.
 * Search Manager supports four additional countries when selected on its own.
 *
 * Keep this catalog aligned with the predefined locations in:
 * - Redirect Manager
 * - Search Manager
 * - ShortLink Manager
 * - SmartLink Manager
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

export const GEO_MANAGER_HANDLES = [
	'redirect-manager',
	'search-manager',
	'shortlink-manager',
	'smartlink-manager',
];

const ALL_GEO_MANAGERS = [...GEO_MANAGER_HANDLES];
const SEARCH_ONLY = ['search-manager'];

export const GEO_LOCATIONS = [
	{ code: 'US', label: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'San Francisco'], handles: ALL_GEO_MANAGERS },
	{ code: 'GB', label: 'United Kingdom', cities: ['London', 'Manchester'], handles: ALL_GEO_MANAGERS },
	{ code: 'AE', label: 'United Arab Emirates', cities: ['Dubai', 'Abu Dhabi'], handles: ALL_GEO_MANAGERS },
	{ code: 'SA', label: 'Saudi Arabia', cities: ['Riyadh', 'Jeddah'], handles: ALL_GEO_MANAGERS },
	{ code: 'DE', label: 'Germany', cities: ['Berlin', 'Munich'], handles: ALL_GEO_MANAGERS },
	{ code: 'FR', label: 'France', cities: ['Paris'], handles: ALL_GEO_MANAGERS },
	{ code: 'NL', label: 'Netherlands', cities: ['Amsterdam'], handles: SEARCH_ONLY },
	{ code: 'SE', label: 'Sweden', cities: ['Stockholm'], handles: SEARCH_ONLY },
	{ code: 'DK', label: 'Denmark', cities: ['Copenhagen'], handles: SEARCH_ONLY },
	{ code: 'NO', label: 'Norway', cities: ['Oslo'], handles: SEARCH_ONLY },
	{ code: 'CA', label: 'Canada', cities: ['Toronto', 'Vancouver'], handles: ALL_GEO_MANAGERS },
	{ code: 'AU', label: 'Australia', cities: ['Sydney', 'Melbourne'], handles: ALL_GEO_MANAGERS },
	{ code: 'JP', label: 'Japan', cities: ['Tokyo'], handles: ALL_GEO_MANAGERS },
	{ code: 'SG', label: 'Singapore', cities: ['Singapore'], handles: ALL_GEO_MANAGERS },
	{ code: 'IN', label: 'India', cities: ['Mumbai', 'Delhi'], handles: ALL_GEO_MANAGERS },
];

export function selectedGeoManagers(plugins = []) {
	return GEO_MANAGER_HANDLES.filter((handle) => plugins.some((plugin) => plugin.handle === handle));
}

export function supportedGeoLocations(plugins = [], catalog = GEO_LOCATIONS) {
	const managers = selectedGeoManagers(plugins);
	if (managers.length === 0) return [];
	return catalog.filter((location) => managers.every((handle) => location.handles.includes(handle)));
}

export function isSupportedGeoFallback(plugins = [], fallback, catalog = GEO_LOCATIONS) {
	if (!fallback) return true;
	return supportedGeoLocations(plugins, catalog).some(
		(location) => location.code === fallback.country && location.cities.includes(fallback.city),
	);
}
