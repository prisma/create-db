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

const PROJECTS_PAGE_SIZE = 1000;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export class DeleteStaleProjectsWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<void> {
		const projects: Project[] = [];
		let cursor: string | null = null;
		let page = 0;

		do {
			const pageCursor: string | null = cursor;
			const res: string = await step.do(`fetch-projects-${page}`, async () => {
				const url = new URL('https://api.prisma.io/v1/projects');
				url.searchParams.set('limit', String(PROJECTS_PAGE_SIZE));
				if (pageCursor) {
					url.searchParams.set('cursor', pageCursor);
				}

				const response = await fetch(url, {
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

			const body: ProjectsResponse = JSON.parse(res);
			projects.push(...body.data);
			cursor = body.pagination.hasMore ? body.pagination.nextCursor : null;
			page += 1;
		} while (cursor);

		const now = Date.now();

		const staleProjects = projects.filter((project) => {
			const createdAt = new Date(project.createdAt).getTime();
			return now - createdAt > STALE_AFTER_MS;
		});

		console.log(`Total projects: ${projects.length}, Stale projects: ${staleProjects.length}`);

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
