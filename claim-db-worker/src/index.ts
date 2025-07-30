import { getClaimSuccessHtml } from './templates/claim-success-template';
import { getClaimHtml } from './templates/claim-template';
import { getErrorHtml } from './templates/error-template';
import { getHomepageHtml } from './templates/homepage-template';

interface Env {
	CLAIM_DB_RATE_LIMITER: RateLimit;
	INTEGRATION_TOKEN: string;
	CLIENT_SECRET: string;
	CLIENT_ID: string;
	CREATE_DB_DATASET: AnalyticsEngineDataset;
	POSTHOG_API_KEY: string;
	POSTHOG_API_HOST: string;
}

const RESPONSE_TYPE = 'code';
const SCOPE = 'workspace:admin';

function generateState(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function errorResponse(title: string, message: string, details?: string, status = 400): Response {
	return new Response(getErrorHtml(title, message, details), {
		status,
		headers: { 'Content-Type': 'text/html' },
	});
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// --- Rate limiting ---
		const { success } = await env.CLAIM_DB_RATE_LIMITER.limit({ key: request.url });

		if (!success) {
			return errorResponse('Rate Limit Exceeded', "We're experiencing high demand. Please try again later.", '', 429);
		}

		async function sendPosthogEvent(event: string, properties: Record<string, any>) {
			const POSTHOG_API_KEY = env.POSTHOG_API_KEY;
			const POSTHOG_PROXY_HOST = env.POSTHOG_API_HOST;

			await fetch(`${POSTHOG_PROXY_HOST}/e`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${POSTHOG_API_KEY}`,
				},
				body: JSON.stringify({
					api_key: POSTHOG_API_KEY,
					event,
					properties,
					distinct_id: 'web-claim',
				}),
			});
		}

		const url = new URL(request.url);

		if (url.pathname === '/success-test') {
			return new Response(getClaimSuccessHtml('123'), {
				headers: { 'Content-Type': 'text/html' },
			});

		// --- Test endpoint for rate limit testing ---
		if (url.pathname === '/test' && request.method === 'GET') {
			return new Response(
				JSON.stringify({
					status: 'success',
					service: 'claim-db-worker',
					timestamp: Date.now(),
					message: 'Rate limit test endpoint - if you see this, rate limiting passed',
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		// --- OAuth Callback Handler ---
		if (url.pathname === '/auth/callback') {
			const code = url.searchParams.get('code');
			const state = url.searchParams.get('state');
			const projectID = url.searchParams.get('projectID');

			if (!state) {
				return errorResponse('OAuth Error', 'Missing state parameter.', 'Please try again.');
			}
			if (!projectID)
				return errorResponse(
					'OAuth Error',
					'Missing project ID parameter.',
					'Please ensure you are accessing this page with a valid project ID.',
				);

			// Exchange code for access token
			const tokenResponse = await fetch('https://auth.prisma.io/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					grant_type: 'authorization_code',
					code: code!,
					redirect_uri: new URL('/auth/callback', request.url).toString(),
					client_id: env.CLIENT_ID,
					client_secret: env.CLIENT_SECRET,
				}).toString(),
			});

			if (!tokenResponse.ok) {
				const text = await tokenResponse.text();
				await sendPosthogEvent('create_db:claim_failed', {
					'project-id': projectID,
					status: tokenResponse.status,
					error: text,
				});
				return errorResponse(
					'OAuth Error',
					'Failed to authenticate with Prisma. Please try again.',
					`Status: ${tokenResponse.status}\nResponse: ${text}`,
					500,
				);
			}

			const tokenData = (await tokenResponse.json()) as { access_token: string };

			// Transfer project
			const transferResponse = await fetch(`https://api.prisma.io/v1/projects/${projectID}/transfer`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${env.INTEGRATION_TOKEN}`,
				},
				body: JSON.stringify({ recipientAccessToken: tokenData.access_token }),
			});

			if (transferResponse.ok) {
				env.CREATE_DB_DATASET.writeDataPoint({
					blobs: ['database_claimed'],
					indexes: ['claim_db'],
				});
				await sendPosthogEvent('create_db:claim_successful', {
					'project-id': projectID,
				});
				return new Response(getClaimSuccessHtml(projectID), {
					headers: { 'Content-Type': 'text/html' },
				});
			} else {
				const responseText = await transferResponse.text();
				await sendPosthogEvent('create_db:claim_failed', {
					'project-id': projectID,
					status: transferResponse.status,
					error: responseText,
				});
				return errorResponse(
					'Project Transfer Failed',
					'Failed to transfer the project. Please try again.',
					`Status: ${transferResponse.status}\nResponse: ${responseText}`,
					500,
				);
			}
		}

		// --- Main Claim Page Handler ---
		const projectID = url.searchParams.get('projectID');
		if (projectID && projectID !== 'undefined') {
			await sendPosthogEvent('create_db:claim_page_viewed', {
				'project-id': projectID,
				'utm-source': url.searchParams.get('utm_source') || 'unknown',
				'utm-medium': url.searchParams.get('utm_medium') || 'unknown',
			});
			const redirectUri = new URL('/auth/callback', request.url);
			redirectUri.searchParams.set('projectID', projectID);

			const authParams = new URLSearchParams({
				client_id: env.CLIENT_ID,
				redirect_uri: redirectUri.toString(),
				response_type: RESPONSE_TYPE,
				scope: SCOPE,
				state: generateState(),
				utm_source: url.searchParams.get('utm_source') || 'unknown',
				utm_medium: 'cli',
			});
			const authUrl = `https://auth.prisma.io/authorize?${authParams.toString()}`;
			return new Response(getClaimHtml(projectID, authUrl), {
				headers: { 'Content-Type': 'text/html' },
			});
		} else if (url.pathname === '/' && projectID !== 'undefined') {
			return new Response(getHomepageHtml(), {
				headers: { 'Content-Type': 'text/html' },
			});
		}

		// --- Fallback: No project ID provided ---
		return errorResponse(
			'Missing Project ID',
			'No project ID was provided in the request.',
			'Please ensure you are accessing this page with a valid project ID parameter.',
		);
	},
};
