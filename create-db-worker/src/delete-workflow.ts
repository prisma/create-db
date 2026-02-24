import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { parseTtlMsInput, clampTtlMs } from './ttl';

type Params = {
	projectID: string;
	ttlMs?: number;
};

type Env = {
	INTEGRATION_TOKEN: string;
};

export class DeleteDbWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<void> {
		const { projectID, ttlMs } = event.payload;

		if (!projectID) {
			throw new Error('No projectID provided.');
		}

		const rawTtlMs = parseTtlMsInput(ttlMs);
		const effectiveTtlMs = clampTtlMs(rawTtlMs);
		const effectiveTtlSeconds = Math.ceil(effectiveTtlMs / 1000);

		await step.sleep(`wait ${effectiveTtlSeconds} seconds`, `${effectiveTtlSeconds} seconds`);

		const res = await fetch(`https://api.prisma.io/v1/projects/${projectID}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.env.INTEGRATION_TOKEN}`,
			},
		});

		if (!res.ok) {
			throw new Error(`Failed to delete project: ${res.statusText}`);
		}

	}
}

export default DeleteDbWorkflow;
