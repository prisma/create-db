import DeleteDbWorkflow from './delete-workflow';

interface Env {
	INTEGRATION_TOKEN: string;
	DELETE_DB_WORKFLOW: Workflow;
	CREATE_DB_RATE_LIMITER: RateLimit;
	CREATE_DB_DATASET: AnalyticsEngineDataset;
}

export { DeleteDbWorkflow };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// --- Rate limiting ---
		const { success } = await env.CREATE_DB_RATE_LIMITER.limit({ key: request.url });

		if (!success) {
			return new Response(`429 Failure - rate limit exceeded for ${request.url}`, { status: 429 });
		}

		const url = new URL(request.url);

		// --- Health check route ---
		if (url.pathname === '/health' && request.method === 'GET') {
			return new Response(JSON.stringify({ status: 'ok', service: 'create-db', timestamp: Date.now() }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// --- Get available regions ---
		if (url.pathname === '/regions' && request.method === 'GET') {
			const regionsResponse = await fetch('https://api.prisma.io/regions', {
				headers: { Authorization: `Bearer ${env.INTEGRATION_TOKEN}` },
			});
			const regionsText = await regionsResponse.text();
			return new Response(regionsText, {
				status: regionsResponse.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// --- Create new project ---
		if (url.pathname === '/create' && request.method === 'POST') {
			let body: { region?: string; name?: string } = {};
			try {
				body = await request.json();
			} catch {
				return new Response('Invalid JSON body', { status: 400 });
			}

			const { region, name } = body;
			if (!region || !name) {
				return new Response('Missing region or name in request body', { status: 400 });
			}

			const payload = JSON.stringify({ region, name });
			const prismaResponse = await fetch('https://api.prisma.io/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${env.INTEGRATION_TOKEN}`,
				},
				body: payload,
			});

			const prismaText = await prismaResponse.text();

			// Trigger delete workflow for the new project
			try {
				const projectID = JSON.parse(prismaText).id;
				await env.DELETE_DB_WORKFLOW.create({ params: { projectID } });
				env.CREATE_DB_DATASET.writeDataPoint({
					blobs: ['database_created'],
					indexes: ['create_db'],
				});
			} catch (e) {
				console.error('Error parsing prismaText or triggering workflow:', e);
			}

			return new Response(prismaText, {
				status: prismaResponse.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// --- Fallback: Method not allowed ---
		return new Response('Method Not Allowed', { status: 405 });
	},
} satisfies ExportedHandler<Env>;
