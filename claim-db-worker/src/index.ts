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

		const url = new URL(request.url);
		const connectionString = url.searchParams.get('connectionString');
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
