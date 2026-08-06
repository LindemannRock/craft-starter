import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
	buildRedisEnableSteps,
	buildRedisRemoveSteps,
	configureRedisEnvironment,
	getRedisState,
	removeRedisEnvironment,
} from '../actions/redis.mjs';

const tempDirs = [];

function tempProject() {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-redis-test-'));
	tempDirs.push(root);
	return root;
}

afterEach(() => {
	for (const dir of tempDirs.splice(0)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

describe('Redis environment configuration', () => {
	it('adds cache defaults while preserving unrelated values', () => {
		const result = configureRedisEnvironment('CRAFT_ENVIRONMENT=dev\nFOO=bar\n');

		expect(result).toContain('CRAFT_ENVIRONMENT=dev');
		expect(result).toContain('FOO=bar');
		expect(result).toContain('# Redis\nREDIS_HOST=redis');
		expect(result).toContain('REDIS_DATABASE=0');
		expect(result).not.toContain('REDIS_SESSION_DB=');
	});

	it('preserves custom connection values and enables sessions', () => {
		const input = [
			'FOO=bar',
			'REDIS_HOST=cache.internal',
			'REDIS_PORT=6380',
			'REDIS_PASSWORD="custom-secret"',
			'REDIS_DATABASE=4',
			'REDIS_SESSION_DB=5',
			'',
		].join('\n');
		const result = configureRedisEnvironment(input, { useSessions: true });

		expect(result).toContain('REDIS_HOST=cache.internal');
		expect(result).toContain('REDIS_PORT=6380');
		expect(result).toContain('REDIS_PASSWORD="custom-secret"');
		expect(result).toContain('REDIS_DATABASE=4');
		expect(result).toContain('REDIS_SESSION_DB=5');
	});

	it('removes sessions independently while keeping cache', () => {
		const input = configureRedisEnvironment('FOO=bar\n', { useSessions: true });
		const result = configureRedisEnvironment(input, { useSessions: false });

		expect(result).toContain('REDIS_HOST=redis');
		expect(result).not.toContain('REDIS_SESSION_DB=');
	});

	it('removes all managed Redis values without touching other env', () => {
		const input = configureRedisEnvironment('FOO=bar\n', { useSessions: true });
		const result = removeRedisEnvironment(input);

		expect(result).toBe('FOO=bar\n');
	});
});

describe('Redis state detection', () => {
	it('recognizes a complete cache and session installation', () => {
		const root = tempProject();
		fs.mkdirSync(path.join(root, '.ddev'), { recursive: true });
		fs.writeFileSync(path.join(root, '.env'), configureRedisEnvironment('', { useSessions: true }));
		fs.writeFileSync(path.join(root, 'composer.json'), JSON.stringify({
			require: { 'yiisoft/yii2-redis': '^2.1.2' },
		}));
		fs.writeFileSync(path.join(root, '.ddev', 'docker-compose.redis.yaml'), 'services: {}\n');

		const state = getRedisState({ root });
		expect(state.enabled).toBe(true);
		expect(state.sessionsEnabled).toBe(true);
		expect(state.partial).toBe(false);
	});

	it('recognizes a partial installation', () => {
		const root = tempProject();
		fs.writeFileSync(path.join(root, '.env'), 'REDIS_HOST=redis\n');
		fs.writeFileSync(path.join(root, 'composer.json'), JSON.stringify({ require: {} }));

		const state = getRedisState({ root });
		expect(state.enabled).toBe(false);
		expect(state.disabled).toBe(false);
		expect(state.partial).toBe(true);
	});
});

describe('Redis infrastructure steps', () => {
	it('installs only missing enablement pieces', () => {
		const steps = buildRedisEnableSteps({ addonInstalled: true, packageInstalled: false });
		expect(steps.map((step) => step.cmd)).toEqual([
			'ddev start',
			'ddev composer require yiisoft/yii2-redis:^2.1.2 --no-interaction',
		]);
	});

	it('removes the package before the DDEV service', () => {
		const steps = buildRedisRemoveSteps({ addonInstalled: true, packageInstalled: true });
		expect(steps.map((step) => step.cmd)).toEqual([
			'ddev start',
			'ddev composer remove yiisoft/yii2-redis --no-interaction',
			'ddev add-on remove redis',
			'ddev restart',
		]);
	});
});
