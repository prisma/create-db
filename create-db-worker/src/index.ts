import DeleteDbWorkflow from './delete-workflow';
import { checkRateLimit } from './rate-limiter';

interface Env {
	INTEGRATION_TOKEN: string;
	DELETE_DB_WORKFLOW: Workflow;
	CREATE_DB_RATE_LIMIT_KV: KVNamespace;
	CREATE_DB_DATASET: AnalyticsEngineDataset;
}

export { DeleteDbWorkflow };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// --- Rate limiting ---
		const { allowed } = await checkRateLimit({
			kv: env.CREATE_DB_RATE_LIMIT_KV,
			key: 'global-rate-limit',
			limit: 100,
			period: 60,
		});
		if (!allowed) {
			return new Response('Rate limit exceeded', { status: 429 });
		}

		const url = new URL(request.url);

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
					blobs: ["database_created"],
					indexes: ["create_db"]
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
