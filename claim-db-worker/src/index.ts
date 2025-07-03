import { checkRateLimit } from './rate-limiter';
import { getClaimSuccessHtml } from './templates/claim-success-template';
import { getClaimHtml } from './templates/claim-template';

interface Env {
	CLAIM_DB_RATE_LIMIT_KV: KVNamespace;
	INTEGRATION_TOKEN: string;
	CLIENT_SECRET: string;
}

const CLIENT_ID = 'cmck0cre900ffxz0vy5deit8y';
const REDIRECT_URI = 'https://claim-db-worker.raycast-0ef.workers.dev/auth/callback';
const RESPONSE_TYPE = 'code';
const SCOPE = 'workspace:admin';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// --- Rate limiting ---
		const { allowed } = await checkRateLimit({
			kv: env.CLAIM_DB_RATE_LIMIT_KV,
			key: 'global-rate-limit',
			limit: 100,
			period: 60,
		});
		if (!allowed) {
			return new Response('Rate limit exceeded', { status: 429 });
		}

		const url = new URL(request.url);

		// --- OAuth Callback Handler ---
		if (url.pathname === '/auth/callback') {
			const code = url.searchParams.get('code');
			const projectID = url.searchParams.get('state');

			// Exchange code for access token
			const tokenResponse = await fetch('https://auth.prisma.io/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					grant_type: 'authorization_code',
					code: code!,
					redirect_uri: REDIRECT_URI,
					client_id: CLIENT_ID,
					client_secret: env.CLIENT_SECRET,
				}).toString(),
			});

			if (!tokenResponse.ok) {
				const text = await tokenResponse.text();
				return new Response(`Token exchange failed: ${tokenResponse.status} ${text}`, { status: 500 });
			}

			const tokenData = (await tokenResponse.json()) as { access_token: string };

			// Transfer project
			const transferResponse = await fetch(`https://api.prisma.io/projects/${projectID}/transfer`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${env.INTEGRATION_TOKEN}`,
				},
				body: JSON.stringify({ recipientAccessToken: tokenData.access_token }),
			});

			if (transferResponse.ok) {
				const html = getClaimSuccessHtml(projectID!);
				return new Response(html, { headers: { 'Content-Type': 'text/html' } });
			} else {
				return new Response('Project claim failed. Please try again.', { status: 500 });
			}
		}

		// --- Main Claim Page Handler ---
		const projectID = url.searchParams.get('projectID');
		if (projectID) {
			const authParams = new URLSearchParams({
				client_id: CLIENT_ID,
				redirect_uri: REDIRECT_URI,
				response_type: RESPONSE_TYPE,
				scope: SCOPE,
				state: projectID,
			});
			const authUrl = `https://auth.prisma.io/authorize?${authParams.toString()}`;
			const html = getClaimHtml(projectID, authUrl);
			return new Response(html, {
				headers: { 'Content-Type': 'text/html' },
			});
		}

		// --- Fallback: No project ID provided ---
		return new Response('No project ID provided', { status: 400 });
	},
};
