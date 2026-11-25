export const MIN_TTL_MS = 30 * 60 * 1000;
/** Default and maximum lifetime of an unclaimed database: 72 hours. */
export const MAX_TTL_MS = 72 * 60 * 60 * 1000;

/**
 * The daily sweep deletes unclaimed projects older than this. It is the maximum
 * lifetime plus a margin, so the sweep never deletes a database before the
 * deletion time the CLI printed; the per-database workflow does that.
 */
export const STALE_PROJECT_AGE_MS = MAX_TTL_MS + 60 * 60 * 1000;

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
