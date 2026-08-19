/**
 * Post-install Redis state detection and `.env` management.
 *
 * Redis has three independently observable pieces: Craft environment values,
 * the Yii Redis Composer package, and the DDEV Redis add-on. Keeping detection
 * here lets the interactive manager repair projects where only some pieces are
 * present without overwriting unrelated project configuration.
 *
 * @copyright 2026 LindemannRock
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import { ROOT } from '../paths.mjs';
import { composerConfigForCraftProfile } from '../config/craft-profiles.mjs';

export const REDIS_ENV_KEYS = ['REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD', 'REDIS_DATABASE', 'REDIS_SESSION_DB'];

const REDIS_DEFAULTS = {
	REDIS_HOST: 'redis',
	REDIS_PORT: '6379',
	REDIS_PASSWORD: '',
	REDIS_DATABASE: '0',
};

/**
 * Read a dotenv value without interpreting it. The raw value is preserved so
 * custom hosts, passwords, and variable references survive reconfiguration.
 */
function readEnvValue(content, key) {
	const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = content.match(new RegExp(`^${escaped}=(.*)$`, 'm'));
	return match ? match[1] : undefined;
}

function hasValue(value) {
	if (value === undefined) return false;
	const normalized = value.trim();
	return normalized !== '' && normalized !== "''" && normalized !== '""';
}

function stripRedisEnvironment(content) {
	const keyPattern = REDIS_ENV_KEYS.join('|');
	return content
		.replace(new RegExp(`^(?:${keyPattern})=.*\\n?`, 'gm'), '')
		.replace(/^# Redis\s*\n?/gm, '')
		.replace(/\n{3,}/g, '\n\n')
		.trimEnd();
}

/**
 * Enable Redis environment values and optionally sessions. Existing non-empty
 * values win over local defaults, which keeps custom/self-hosted connections.
 */
export function configureRedisEnvironment(content, { useSessions = false } = {}) {
	const values = {};
	for (const [key, fallback] of Object.entries(REDIS_DEFAULTS)) {
		const current = readEnvValue(content, key);
		values[key] = key === 'REDIS_PASSWORD' ? (current ?? fallback) : hasValue(current) ? current : fallback;
	}

	const currentSessionDb = readEnvValue(content, 'REDIS_SESSION_DB');
	const lines = ['# Redis', ...Object.entries(values).map(([key, value]) => `${key}=${value}`)];
	if (useSessions) {
		lines.push(`REDIS_SESSION_DB=${hasValue(currentSessionDb) ? currentSessionDb : '1'}`);
	}

	const base = stripRedisEnvironment(content);
	return `${base ? `${base}\n\n` : ''}${lines.join('\n')}\n`;
}

/** Remove Craft's Redis activation values while preserving all unrelated env. */
export function removeRedisEnvironment(content) {
	const base = stripRedisEnvironment(content);
	return base ? `${base}\n` : '';
}

export function writeRedisEnvironment({ useSessions = false, root = ROOT } = {}) {
	const envPath = path.join(root, '.env');
	const content = fs.readFileSync(envPath, 'utf-8');
	fs.writeFileSync(envPath, configureRedisEnvironment(content, { useSessions }));
}

export function deleteRedisEnvironment({ root = ROOT } = {}) {
	const envPath = path.join(root, '.env');
	const content = fs.readFileSync(envPath, 'utf-8');
	fs.writeFileSync(envPath, removeRedisEnvironment(content));
}

/** Detect complete, disabled, and mixed/partial Redis installations. */
export function getRedisState({ root = ROOT, craftProfile, craftReleaseChannel } = {}) {
	const redisPackage = requireRedisPackage(craftProfile, craftReleaseChannel);
	const envPath = path.join(root, '.env');
	const composerPath = path.join(root, 'composer.json');
	const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

	let composer = {};
	if (fs.existsSync(composerPath)) {
		composer = JSON.parse(fs.readFileSync(composerPath, 'utf-8'));
	}

	const envValues = Object.fromEntries(REDIS_ENV_KEYS.map((key) => [key, readEnvValue(env, key)]));
	const hasEnvironment = Object.values(envValues).some((value) => value !== undefined);
	const cacheEnabled = hasValue(envValues.REDIS_HOST);
	const sessionsEnabled = hasValue(envValues.REDIS_SESSION_DB);
	const packageInstalled = Boolean(
		composer.require?.[redisPackage.name] || composer['require-dev']?.[redisPackage.name],
	);
	const addonInstalled = [
		path.join(root, '.ddev', 'docker-compose.redis.yaml'),
		path.join(root, '.ddev', 'addon-metadata', 'redis'),
		path.join(root, '.ddev', 'redis'),
	].some((candidate) => fs.existsSync(candidate));

	const enabled = cacheEnabled && packageInstalled && addonInstalled;
	const disabled = !hasEnvironment && !packageInstalled && !addonInstalled;

	return {
		hasEnvironment,
		cacheEnabled,
		sessionsEnabled,
		packageInstalled,
		addonInstalled,
		enabled,
		disabled,
		partial: !enabled && !disabled,
	};
}

/** Commands needed to enable or repair infrastructure for the detected state. */
export function buildRedisEnableSteps(state, { craftProfile, craftReleaseChannel } = {}) {
	const redisPackage = requireRedisPackage(craftProfile, craftReleaseChannel);
	const steps = [];
	if (!state.addonInstalled) {
		steps.push({ msg: 'Installing DDEV Redis add-on', cmd: 'ddev add-on get ddev/ddev-redis' });
	}
	steps.push({ msg: 'Starting DDEV with Redis', cmd: 'ddev start' });
	if (!state.packageInstalled) {
		steps.push({
			msg: 'Installing Yii Redis package',
			cmd: `ddev composer require ${redisPackage.name}:${redisPackage.version} --no-interaction`,
		});
	}
	return steps;
}

/** Commands needed after `.env` has been deactivated during full removal. */
export function buildRedisRemoveSteps(state, { craftProfile, craftReleaseChannel } = {}) {
	const redisPackage = requireRedisPackage(craftProfile, craftReleaseChannel);
	const steps = [];
	if (state.packageInstalled) {
		steps.push({ msg: 'Starting DDEV', cmd: 'ddev start' });
		steps.push({
			msg: 'Removing Yii Redis package',
			cmd: `ddev composer remove ${redisPackage.name} --no-interaction`,
		});
	}
	if (state.addonInstalled) {
		steps.push({ msg: 'Removing DDEV Redis add-on', cmd: 'ddev add-on remove redis' });
		steps.push({ msg: 'Restarting DDEV without Redis', cmd: 'ddev restart' });
	}
	return steps;
}

function requireRedisPackage(craftProfile, craftReleaseChannel) {
	const redisPackage = composerConfigForCraftProfile(craftProfile, craftReleaseChannel).redis;
	if (!redisPackage) {
		throw new Error('Redis management is not supported by the selected Craft profile yet.');
	}
	return redisPackage;
}

/** Remove only files owned by the official DDEV Redis add-on. */
export function removeRedisAddonFiles({ root = ROOT } = {}) {
	const candidates = [
		path.join(root, '.ddev', 'docker-compose.redis.yaml'),
		path.join(root, '.ddev', 'addon-metadata', 'redis'),
		path.join(root, '.ddev', 'redis'),
	];
	for (const candidate of candidates) {
		fs.rmSync(candidate, { recursive: true, force: true });
	}
}
