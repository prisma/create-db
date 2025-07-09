import { checkRateLimit } from './rate-limiter';
import { getClaimSuccessHtml } from './templates/claim-success-template';
import { getClaimHtml } from './templates/claim-template';
import { getErrorHtml } from './templates/error-template';

interface Env {
	CLAIM_DB_RATE_LIMIT_KV: KVNamespace;
	INTEGRATION_TOKEN: string;
	CLIENT_SECRET: string;
	CLIENT_ID: string;
}

const RESPONSE_TYPE = 'code';
const SCOPE = 'workspace:admin';

function generateState(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function errorResponse(title: string, message: string, details?: string, status = 400): Response {
	return new Response(getErrorHtml(title, message, details), { 
		status,
		headers: { 'Content-Type': 'text/html' }
	});
}

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
			const state = url.searchParams.get('state');
			const projectID = url.searchParams.get('projectID');

			if (!state) return errorResponse('OAuth Error', 'Missing state parameter.', 'Please try again.');
			if (!projectID) return errorResponse('OAuth Error', 'Missing project ID parameter.', 'Please ensure you are accessing this page with a valid project ID.');

			// Exchange code for access token
			const tokenResponse = await fetch('https://auth.prisma.io/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					grant_type: 'authorization_code',
					code: code!,
					redirect_uri: new URL("/auth/callback", request.url).toString(),
					client_id: env.CLIENT_ID,
					client_secret: env.CLIENT_SECRET,
				}).toString(),
			});

			if (!tokenResponse.ok) {
				const text = await tokenResponse.text();
				return errorResponse('OAuth Error', 'Failed to authenticate with Prisma. Please try again.', `Status: ${tokenResponse.status}\nResponse: ${text}`, 500);
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
				return new Response(getClaimSuccessHtml(projectID), { 
					headers: { 'Content-Type': 'text/html' } 
				});
			} else {
				const responseText = await transferResponse.text();
				return errorResponse('Project Transfer Failed', 'Failed to transfer the project. Please try again.', `Status: ${transferResponse.status}\nResponse: ${responseText}`, 500);
			}
		}

		// --- Main Claim Page Handler ---
		const projectID = url.searchParams.get('projectID');
		if (projectID) {

			const redirectUri = new URL("/auth/callback", request.url);
			redirectUri.searchParams.set('projectID', projectID);
			
			const authParams = new URLSearchParams({
				client_id: env.CLIENT_ID,
				redirect_uri: redirectUri.toString(),
				response_type: RESPONSE_TYPE,
				scope: SCOPE,
				state: generateState(),
			});
			const authUrl = `https://auth.prisma.io/authorize?${authParams.toString()}`;
			return new Response(getClaimHtml(projectID, authUrl), {
				headers: { 'Content-Type': 'text/html' },
			});
		}

		// --- Fallback: No project ID provided ---
		return errorResponse('Missing Project ID', 'No project ID was provided in the request.', 'Please ensure you are accessing this page with a valid project ID parameter.');
	},
};
