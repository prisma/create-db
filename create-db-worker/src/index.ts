import DeleteDbWorkflow from './delete-workflow';
import { PosthogEventCapture } from './analytics';
interface Env {
	INTEGRATION_TOKEN: string;
	DELETE_DB_WORKFLOW: Workflow;
	CREATE_DB_RATE_LIMITER: RateLimit;
	CREATE_DB_DATASET: AnalyticsEngineDataset;
	POSTHOG_API_KEY?: string;
	POSTHOG_API_HOST?: string;
}

export { DeleteDbWorkflow };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const analytics = new PosthogEventCapture(env);

		// --- Rate limiting ---
		const { success } = await env.CREATE_DB_RATE_LIMITER.limit({ key: request.url });

		if (!success) {
			return new Response(`429 Failure - rate limit exceeded for ${request.url}`, { status: 429 });
		}

		const url = new URL(request.url);

		// --- Test endpoint for rate limit testing ---
		if (url.pathname === '/test' && request.method === 'GET') {
			return new Response(
				JSON.stringify({
					status: 'success',
					service: 'create-db-worker',
					timestamp: Date.now(),
					message: 'Rate limit test endpoint - if you see this, rate limiting passed',
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		// --- Health check route ---
		if (url.pathname === '/health' && request.method === 'GET') {
			return new Response(JSON.stringify({ status: 'ok', service: 'create-db', timestamp: Date.now() }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// --- Get available regions ---
		if (url.pathname === '/regions' && request.method === 'GET') {
			const regionsResponse = await fetch('https://api.prisma.io/v1/regions/postgres', {
				headers: { Authorization: `Bearer ${env.INTEGRATION_TOKEN}` },
			});
			const regionsText = await regionsResponse.text();
			return new Response(regionsText, {
				status: regionsResponse.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// --- Analytics endpoint ---
		if (url.pathname === '/analytics' && request.method === 'POST') {
			let body: any = {};
			try {
				body = await request.json();
			} catch {
				return new Response('Invalid JSON body', { status: 400 });
			}

			const { eventName, properties } = body;
			if (!eventName) {
				return new Response('Missing eventName in request body', { status: 400 });
			}

			try {
				await analytics.capture(eventName, properties || {});
				return new Response(JSON.stringify({ status: 'success', event: eventName }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				console.error('Analytics error:', error);
				return new Response(
					JSON.stringify({
						status: 'error',
						event: eventName,
						error: error instanceof Error ? error.message : String(error),
					}),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json' },
					},
				);
			}
		}

		// --- Create new project ---
		if (url.pathname === '/create' && request.method === 'POST') {
			let body: { region?: string; name?: string; analytics?: { eventName?: string; properties?: any } } = {};
			try {
				body = await request.json();
			} catch {
				return new Response('Invalid JSON body', { status: 400 });
			}

			const { region, name, analytics: analyticsData } = body;
			if (!region || !name) {
				return new Response('Missing region or name in request body', { status: 400 });
			}

			const prismaResponse = await fetch('https://api.prisma.io/v1/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${env.INTEGRATION_TOKEN}`,
				},
				body: JSON.stringify({
					region,
					name,
				}),
			});

			const prismaText = await prismaResponse.text();

			const backgroundTasks = async () => {
				try {
					const response = JSON.parse(prismaText);
					const projectID = response.data ? response.data.id : response.id;

					const workflowPromise = env.DELETE_DB_WORKFLOW.create({ params: { projectID } });

					const analyticsPromise = env.CREATE_DB_DATASET.writeDataPoint({
						blobs: ['database_created'],
						indexes: ['create_db'],
					});

					// Handle PostHog analytics if provided
					let posthogPromise = Promise.resolve();
					if (analyticsData && analyticsData.eventName) {
						try {
							posthogPromise = analytics.capture(analyticsData.eventName, analyticsData.properties || {});
						} catch (e) {
							console.error('Error sending PostHog analytics:', e);
						}
					}

					await Promise.all([workflowPromise, analyticsPromise, posthogPromise]);
				} catch (e) {
					console.error('Error in background tasks:', e);
				}
			};

			ctx.waitUntil(backgroundTasks());

			return new Response(prismaText, {
				status: prismaResponse.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// --- Fallback: Method not allowed ---
		return new Response('Method Not Allowed', { status: 405 });
	},
} satisfies ExportedHandler<Env>;
