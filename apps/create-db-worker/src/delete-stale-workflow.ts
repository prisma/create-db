import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

type Params = Record<string, never>;

type Env = {
	INTEGRATION_TOKEN: string;
};

type Project = {
	id: string;
	name: string;
	createdAt: string;
};

type ProjectsResponse = {
	data: Project[];
	pagination: {
		nextCursor: string | null;
		hasMore: boolean;
	};
};

export class DeleteStaleProjectsWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<void> {
		const res = await step.do('fetch-projects', async () => {
			const response = await fetch('https://api.prisma.io/v1/projects?limit=1000', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.env.INTEGRATION_TOKEN}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch projects: ${response.statusText}`);
			}

			const data = await response.text();
			return data;
		});

		const projects: ProjectsResponse = JSON.parse(res);
		const now = Date.now();
		const twentyFourHours = 24 * 60 * 60 * 1000;

		const staleProjects = projects.data.filter((project) => {
			const createdAt = new Date(project.createdAt).getTime();
			return now - createdAt > twentyFourHours;
		});

		console.log(`Total projects: ${projects.data.length}, Stale projects: ${staleProjects.length}`);

		for (const project of staleProjects) {
			await step.do(`delete-project-${project.id}`, async () => {
				const deleteRes = await fetch(`https://api.prisma.io/v1/projects/${project.id}`, {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.env.INTEGRATION_TOKEN}`,
					},
				});

				if (!deleteRes.ok) {
					throw new Error(`Failed to delete project ${project.id}: ${deleteRes.statusText}`);
				}

				console.log(`Deleted stale project: ${project.id} (${project.name})`);
			});
		}

		console.log(`Finished deleting ${staleProjects.length} stale projects`);
	}
}

export default DeleteStaleProjectsWorkflow;
