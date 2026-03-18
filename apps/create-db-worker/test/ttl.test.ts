import { describe, it, expect } from 'vitest';
import { parseTtlMsInput, isTtlMsInRange, clampTtlMs, MIN_TTL_MS, MAX_TTL_MS } from '../src/ttl';

describe('parseTtlMsInput', () => {
	it('returns the value for a valid finite number', () => {
		expect(parseTtlMsInput(3600000)).toBe(3600000);
	});

	it('floors float values', () => {
		expect(parseTtlMsInput(3600000.9)).toBe(3600000);
	});

	it('returns undefined for a string', () => {
		expect(parseTtlMsInput('3600000')).toBeUndefined();
	});

	it('returns undefined for null', () => {
		expect(parseTtlMsInput(null)).toBeUndefined();
	});

	it('returns undefined for undefined', () => {
		expect(parseTtlMsInput(undefined)).toBeUndefined();
	});

	it('returns undefined for Infinity', () => {
		expect(parseTtlMsInput(Infinity)).toBeUndefined();
	});

	it('returns undefined for NaN', () => {
		expect(parseTtlMsInput(NaN)).toBeUndefined();
	});
});

describe('isTtlMsInRange', () => {
	it('returns true for the minimum value', () => {
		expect(isTtlMsInRange(MIN_TTL_MS)).toBe(true);
	});

	it('returns true for the maximum value', () => {
		expect(isTtlMsInRange(MAX_TTL_MS)).toBe(true);
	});

	it('returns true for a value within range', () => {
		expect(isTtlMsInRange(3600000)).toBe(true);
	});

	it('returns false for a value below minimum', () => {
		expect(isTtlMsInRange(MIN_TTL_MS - 1)).toBe(false);
	});

	it('returns false for a value above maximum', () => {
		expect(isTtlMsInRange(MAX_TTL_MS + 1)).toBe(false);
	});
});

describe('clampTtlMs', () => {
	it('returns MAX_TTL_MS for undefined', () => {
		expect(clampTtlMs(undefined)).toBe(MAX_TTL_MS);
	});

	it('returns MAX_TTL_MS for NaN', () => {
		expect(clampTtlMs(NaN)).toBe(MAX_TTL_MS);
	});

	it('clamps to MIN_TTL_MS when below range', () => {
		expect(clampTtlMs(1000)).toBe(MIN_TTL_MS);
	});

	it('clamps to MAX_TTL_MS when above range', () => {
		expect(clampTtlMs(MAX_TTL_MS + 99999)).toBe(MAX_TTL_MS);
	});

	it('returns the value unchanged when within range', () => {
		expect(clampTtlMs(3600000)).toBe(3600000);
	});
});
