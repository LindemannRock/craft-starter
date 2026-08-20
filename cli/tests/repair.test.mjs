import {describe, expect, it, vi} from 'vitest';
import {executeRepair, REPAIR_ACTIONS} from '../scripts/repair.mjs';

describe('repair picker actions', () => {
	it('keeps every useful repair operation discoverable', () => {
		expect(REPAIR_ACTIONS.map(({value}) => value)).toEqual(['dependencies', 'logs', 'vite', 'runtime']);
	});

	it.each([
		['dependencies', 'repair-dependencies'],
		['logs', 'repair-logs'],
		['vite', 'repair-vite'],
	])('routes %s through its internal Make target', async (action, target) => {
		const run = vi.fn().mockResolvedValue(0);
		expect(await executeRepair(action, {run})).toBe(0);
		expect(run).toHaveBeenCalledWith('make', [target]);
	});

	it('cleans and reinstalls the complete runtime in that order', async () => {
		const calls = [];
		const nuke = vi.fn(({craftProfile}) => calls.push(`nuke:${craftProfile}`));
		const run = vi.fn(async (command, args) => {
			calls.push(`${command}:${args.join(' ')}`);
			return 0;
		});

		expect(await executeRepair('runtime', {run, nuke, craftProfile: 'craft6'})).toBe(0);
		expect(calls).toEqual(['nuke:craft6', 'make:install']);
	});

	it('rejects unknown actions', async () => {
		await expect(executeRepair('unknown')).rejects.toThrow('Unknown repair action');
	});
});
