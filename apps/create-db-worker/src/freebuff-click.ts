import { DurableObject } from 'cloudflare:workers';

/**
 * Freebuff ad conversions for databases created from a Freebuff ad.
 *
 * Reference: https://freebuff.com/docs/advertisers/conversions
 *
 * `create-db` sends the signed click id it read from `PRISMA_FREEBUFF_BFCID`.
 * It is kept here, per project, until the database expires, and is reported
 * to Freebuff only once the database has been claimed. The click id is never
 * logged, put in a URL or returned in a response.
 */

const FREEBUFF_CONVERSIONS_URL = 'https://freebuff.com/api/advertisers/conversions';
const REQUEST_TIMEOUT_MS = 8_000;
/** Freebuff's signed click id, as its site tag accepts it: at most 512 characters. */
const CLICK_ID_PATTERN = /^bfc_[A-Za-z0-9._-]{1,508}$/;
/** Waits before each retry of a report that failed for a reason that can pass. */
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];

/** Returns the click id unchanged when it is well formed, otherwise undefined. */
export function parseFreebuffClickId(value: unknown): string | undefined {
	return typeof value === 'string' && CLICK_ID_PATTERN.test(value) ? value : undefined;
}

type Conversion = {
	clickId: string;
	eventType: 'signup_completed';
	eventId: string;
	occurredAt: string;
};

type SendResult = 'accepted' | 'refused' | 'retry';

/** Never throws: a failed ad report must not fail the claim. */
async function sendConversion(apiKey: string, conversion: Conversion): Promise<SendResult> {
	try {
		const response = await fetch(FREEBUFF_CONVERSIONS_URL, {
			method: 'POST',
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(conversion),
		});
		// A repeated event id is answered with 200 and `deduped: true`.
		if (response.ok) {
			return 'accepted';
		}
		console.warn(`[freebuff] conversion report failed with status ${response.status}`);
		return response.status === 429 || response.status >= 500 ? 'retry' : 'refused';
	} catch (error) {
		console.warn(`[freebuff] conversion report failed: ${error instanceof Error ? error.name : 'unknown error'}`);
		return 'retry';
	}
}

/**
 * What happened to the report of a claim. `no-click`: the database did not
 * come from a Freebuff ad, or its claim was already reported. `no-api-key`:
 * `FREEBUFF_CONVERSION_API_KEY` is not set. `failed`: Freebuff refused the
 * report, or every retry failed.
 */
export type ClaimReport = 'reported' | 'retrying' | 'failed' | 'no-click' | 'no-api-key';

type Env = { FREEBUFF_CONVERSION_API_KEY?: string };

/** One per project: holds its Freebuff click id for the claim window and reports the claim. */
export class FreebuffClick extends DurableObject<Env> {
	/** Keeps the click id until `expiresAt`, when the unclaimed database is deleted. */
	async store(clickId: string, expiresAt: number): Promise<void> {
		await this.ctx.storage.put('clickId', clickId);
		await this.ctx.storage.setAlarm(expiresAt);
	}

	/**
	 * Reports the claim of this project by `accountId` to Freebuff. The event
	 * id and time are fixed on the first call, so a repeated call or a retry
	 * sends the same conversion and Freebuff counts it once.
	 */
	async reportClaim(accountId: string): Promise<ClaimReport> {
		const clickId = await this.ctx.storage.get<string>('clickId');
		if (!clickId) {
			return 'no-click';
		}

		let conversion = await this.ctx.storage.get<Conversion>('conversion');
		if (!conversion) {
			conversion = {
				clickId,
				eventType: 'signup_completed',
				eventId: `signup_completed:prisma:${accountId}`,
				occurredAt: new Date().toISOString(),
			};
			await this.ctx.storage.put({ conversion, attempts: 0 });
		}

		return this.#send(conversion);
	}

	/** Deletes an unclaimed click id at expiry, or retries a report that has not gone through. */
	async alarm(): Promise<void> {
		const conversion = await this.ctx.storage.get<Conversion>('conversion');
		if (!conversion || (await this.#send(conversion)) === 'no-api-key') {
			await this.#forget();
		}
	}

	async #send(conversion: Conversion): Promise<ClaimReport> {
		const apiKey = this.env.FREEBUFF_CONVERSION_API_KEY;
		if (!apiKey) {
			return 'no-api-key';
		}

		const result = await sendConversion(apiKey, conversion);
		const attempts = (await this.ctx.storage.get<number>('attempts')) ?? 0;
		const retryDelay = RETRY_DELAYS_MS[attempts];
		if (result === 'retry' && retryDelay !== undefined) {
			await this.ctx.storage.put('attempts', attempts + 1);
			await this.ctx.storage.setAlarm(Date.now() + retryDelay);
			return 'retrying';
		}

		await this.#forget();
		return result === 'accepted' ? 'reported' : 'failed';
	}

	async #forget(): Promise<void> {
		await this.ctx.storage.deleteAlarm();
		await this.ctx.storage.deleteAll();
	}
}
