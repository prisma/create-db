export const MIN_TTL_MS = 30 * 60 * 1000;
export const MAX_TTL_MS = 24 * 60 * 60 * 1000;

export function parseTtlMsInput(value: unknown): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return undefined;
	}

	return Math.floor(value);
}

export function isTtlMsInRange(value: number): boolean {
	return value >= MIN_TTL_MS && value <= MAX_TTL_MS;
}

export function clampTtlMs(value: number | undefined): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return MAX_TTL_MS;
	}

	return Math.max(MIN_TTL_MS, Math.min(MAX_TTL_MS, value));
}
