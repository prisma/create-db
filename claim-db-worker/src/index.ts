export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const connectionString = url.searchParams.get('connectionString');
		if (!connectionString) {
			return new Response('No connection string provided.', { status: 400 });
		}
		return new Response(`Connection String successfully sent to worker: ${connectionString}`);
	},
} satisfies ExportedHandler<Env>;
