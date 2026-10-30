import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteStaleProjectsWorkflow } from '../src/delete-stale-workflow';

const HOUR_MS = 60 * 60 * 1000;

function hoursAgo(hours: number) {
	return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

function page(data: { id: string; createdAt: string }[], nextCursor: string | null) {
	return new Response(
		JSON.stringify({
			data: data.map((project) => ({ ...project, name: project.id })),
			pagination: { hasMore: nextCursor !== null, nextCursor },
		}),
	);
}

async function runWorkflow() {
	const stepNames: string[] = [];
	const step = {
		do: async (name: string, callback: () => Promise<unknown>) => {
			stepNames.push(name);
			return callback();
		},
	};
	// workerd only constructs a WorkflowEntrypoint itself, so run the method on a stand-in `this`
	await DeleteStaleProjectsWorkflow.prototype.run.call(
		{ env: { INTEGRATION_TOKEN: 'test-token' } } as any,
		{} as any,
		step as any,
	);
	return stepNames;
}

describe('DeleteStaleProjectsWorkflow', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	function requestsTo(method: string) {
		return fetchMock.mock.calls.filter(([, init]) => init?.method === method).map(([url]) => new URL(url));
	}

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
	});

	it('walks every page and deletes stale projects from all of them', async () => {
		fetchMock
			.mockResolvedValueOnce(
				page(
					[
						{ id: 'stale-1', createdAt: hoursAgo(30) },
						{ id: 'fresh-1', createdAt: hoursAgo(2) },
					],
					'fresh-1',
				),
			)
			.mockResolvedValueOnce(page([{ id: 'stale-2', createdAt: hoursAgo(25) }], null))
			.mockImplementation(async () => new Response(null, { status: 200 }));

		const stepNames = await runWorkflow();

		const lists = requestsTo('GET');
		expect(lists).toHaveLength(2);
		expect(lists[0].searchParams.get('cursor')).toBeNull();
		expect(lists[1].searchParams.get('cursor')).toBe('fresh-1');

		expect(requestsTo('DELETE').map((url) => url.pathname)).toEqual([
			'/v1/projects/stale-1',
			'/v1/projects/stale-2',
		]);

		expect(new Set(stepNames).size).toBe(stepNames.length);
	});

	it('stops after one page when there are no more projects', async () => {
		fetchMock.mockResolvedValueOnce(page([{ id: 'fresh-1', createdAt: hoursAgo(1) }], null));

		await runWorkflow();

		expect(requestsTo('GET')).toHaveLength(1);
		expect(requestsTo('DELETE')).toHaveLength(0);
	});

	it('fails when a page cannot be fetched', async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 500, statusText: 'Server Error' }));

		await expect(runWorkflow()).rejects.toThrow('Failed to fetch projects');
	});
});
