import { checkRateLimit } from './rate-limiter';

interface Env {
	CLAIM_DB_RATE_LIMIT_KV: KVNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { allowed, reset } = await checkRateLimit({
			kv: env.CLAIM_DB_RATE_LIMIT_KV,
			key: 'global-rate-limit',
			limit: 100,
			period: 60,
		});

		if (!allowed) {
			return new Response(JSON.stringify({ error: 'Rate limit exceeded', reset }), {
				status: 429,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		let connectionString: string | null = null;
		if (request.method === 'POST') {
			try {
				const body = await request.json();
				if (typeof body === 'object' && body !== null && 'connectionString' in body) {
					connectionString = (body as { connectionString?: string }).connectionString || null;
				} else {
					connectionString = null;
				}
			} catch (e) {
				return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		} else {
			const url = new URL(request.url);
			connectionString = url.searchParams.get('connectionString');
		}

		if (!connectionString) {
			return new Response(JSON.stringify({ error: 'No connection string provided.' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		return new Response(JSON.stringify({ success: true, connectionString }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	},
} satisfies ExportedHandler<Env>;
