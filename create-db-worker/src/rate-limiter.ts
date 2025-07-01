export interface RateLimiterOptions {
	kv: KVNamespace;
	key: string;
	limit: number;
	period: number;
}

export async function checkRateLimit({ kv, key, limit, period }: RateLimiterOptions): Promise<{ allowed: boolean; reset: number }> {
	const now = Math.floor(Date.now() / 1000);

	const value = (await kv.get(key, { type: 'json' })) as { count: number; reset: number } | null;
	let count = 0;
	let reset = now + period;

	if (value && value.reset > now) {
		count = value.count;
		reset = value.reset;
	} else {
		// New window
		count = 0;
		reset = now + period;
	}

	if (count >= limit) {
		return { allowed: false, reset };
	}

	await kv.put(key, JSON.stringify({ count: count + 1, reset }), { expirationTtl: period });
	return { allowed: true, reset };
}
