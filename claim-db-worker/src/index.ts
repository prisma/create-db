import { checkRateLimit } from './rate-limiter';
import { getClaimHtml } from './claim-template';

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
		const projectID = url.searchParams.get('projectID');

		if (projectID) {
			const html = getClaimHtml(projectID);
			return new Response(html, {
				headers: { 'Content-Type': 'text/html' },
			});
		}

		// Default response if no projectID is present
		return new Response('No project ID provided', { status: 400 });
	},
};
