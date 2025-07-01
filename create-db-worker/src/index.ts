import DeleteDbWorkflow from './delete-workflow';
import { checkRateLimit } from './rate-limiter';

interface Env {
	INTEGRATION_TOKEN: string;
	DELETE_DB_WORKFLOW: Workflow;
	CREATE_DB_RATE_LIMIT_KV: KVNamespace;
}

export { DeleteDbWorkflow };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		console.log('Received request:', request.method, request.url);

		const { allowed, reset } = await checkRateLimit({
			kv: env.CREATE_DB_RATE_LIMIT_KV,
			key: 'global-rate-limit',
			limit: 100,
			period: 60,
		});

		if (!allowed) {
			return new Response('Rate limit exceeded', { status: 429 });
		}

		const url = new URL(request.url);
		if (url.pathname === '/health') {
			return new Response('Worker is running!', { status: 200 });
		}

		if (request.method === 'GET') {
			const regionsResponse = await fetch('https://api.prisma.io/regions', {
				headers: { Authorization: `Bearer ${env.INTEGRATION_TOKEN}` },
			});
			const regionsText = await regionsResponse.text();
			return new Response(regionsText, {
				status: regionsResponse.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (request.method === 'POST') {
			let body: { region?: string; name?: string } = {};
			try {
				body = await request.json();
			} catch (e) {
				return new Response('Invalid JSON body', { status: 400 });
			}

			const { region, name } = body;
			if (!region || !name) {
				return new Response('Missing region or name in request body', { status: 400 });
			}

			const payload = JSON.stringify({ region, name });

			const prismaResponse = await fetch('https://api.prisma.io/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.INTEGRATION_TOKEN}` },
				body: payload,
			});

			const prismaText = await prismaResponse.text();

			try {
				const projectID = JSON.parse(prismaText).id;
				await env.DELETE_DB_WORKFLOW.create({ params: { projectID } });
			} catch (e) {
				console.error('Error parsing prismaText: ', e);
			}

			return new Response(prismaText, {
				status: prismaResponse.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response('Method Not Allowed', { status: 405 });
	},
} satisfies ExportedHandler<Env>;
