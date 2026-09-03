import { describe, expect, it } from 'vitest';
import {
	GEO_LOCATIONS,
	isSupportedGeoFallback,
	selectedGeoManagers,
	supportedGeoLocations,
} from '../config/geo-locations.mjs';

const plugin = (handle) => ({ handle });

describe('local analytics location catalog', () => {
	it('detects only plugins that consume the shared fallback', () => {
		expect(selectedGeoManagers([plugin('search-manager'), plugin('formie-rest-api')])).toEqual(['search-manager']);
	});

	it('offers Search Manager its additional supported countries', () => {
		const codes = supportedGeoLocations([plugin('search-manager')]).map(({ code }) => code);
		expect(codes).toEqual(GEO_LOCATIONS.map(({ code }) => code));
		expect(codes).toEqual(expect.arrayContaining(['NL', 'SE', 'DK', 'NO']));
	});

	it('uses the intersection when another manager is also selected', () => {
		const locations = supportedGeoLocations([plugin('search-manager'), plugin('redirect-manager')]);
		const codes = locations.map(({ code }) => code);
		expect(codes).not.toEqual(expect.arrayContaining(['NL', 'SE', 'DK', 'NO']));
		expect(locations.find(({ code }) => code === 'AE').cities).toEqual(['Dubai', 'Abu Dhabi']);
	});

	it('offers nothing when no compatible manager is selected', () => {
		expect(supportedGeoLocations([plugin('formie-rest-api')])).toEqual([]);
	});

	it('rejects a Search-only location when another selected manager lacks it', () => {
		const plugins = [plugin('search-manager'), plugin('redirect-manager')];
		expect(isSupportedGeoFallback(plugins, { country: 'NL', city: 'Amsterdam' })).toBe(false);
		expect(isSupportedGeoFallback(plugins, { country: 'AE', city: 'Dubai' })).toBe(true);
	});
});
