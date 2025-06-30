import DeleteDbWorkflow from './delete-workflow';

interface Env {
	INTEGRATION_TOKEN: string;
	DELETE_DB_WORKFLOW: Workflow;
}

export { DeleteDbWorkflow };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
