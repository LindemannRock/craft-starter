/**
 * Shared local analytics fallback for LR manager plugins.
 *
 * This only affects private/local IP addresses, which cannot be geolocated.
 * Public visitor IPs continue to use each plugin's configured geo provider.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import * as p from '@clack/prompts';
import { selectedGeoManagers, supportedGeoLocations } from '../config/geo-locations.mjs';
import { cancel } from '../utils/cancel.mjs';

export async function promptGeoFallback(plugins = []) {
	const managers = selectedGeoManagers(plugins);
	if (managers.length === 0) return null;

	p.log.info(
		'Selected analytics plugins can assign a known location to private/local IP addresses.\n' +
		'Public visitor locations are unaffected. The same fallback will be used by every selected manager.',
	);

	const enabled = await p.confirm({
		message: 'Set a local analytics location fallback?',
		initialValue: false,
	});
	if (p.isCancel(enabled)) cancel();
	if (!enabled) return null;

	const locations = supportedGeoLocations(plugins);
	const country = await p.select({
		message: 'Fallback country',
		options: locations.map((location) => ({
			value: location.code,
			label: location.label,
			hint: location.cities.join(', '),
		})),
	});
	if (p.isCancel(country)) cancel();

	const selectedCountry = locations.find((location) => location.code === country);
	const city = await p.select({
		message: 'Fallback city',
		options: selectedCountry.cities.map((value) => ({ value, label: value })),
	});
	if (p.isCancel(city)) cancel();

	return { country, city };
}
