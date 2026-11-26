import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext, runInDurableObject, runDurableObjectAlarm } from 'cloudflare:test';
import CreateDbWorker, { handler as worker } from '../src/index';
import { FreebuffClick, parseFreebuffClickId } from '../src/freebuff-click';

const CLICK_ID = 'bfc_1.signed-click.id';
const FREEBUFF_URL = 'https://freebuff.com/api/advertisers/conversions';

const namespace = env.FREEBUFF_CLICK as DurableObjectNamespace<FreebuffClick>;
let projectCount = 0;

/** A fresh project per test, with or without a Freebuff API key. */
function click({ apiKey = 'fbadv_test_key' }: { apiKey?: string | null } = {}) {
	const stub = namespace.get(namespace.idFromName(`proj_${++projectCount}_${crypto.randomUUID()}`));
	const withKey = <T>(run: (instance: FreebuffClick) => Promise<T>) =>
		runInDurableObject(stub, (instance: FreebuffClick) => {
			(instance as unknown as { env: { FREEBUFF_CONVERSION_API_KEY?: string } }).env = {
				FREEBUFF_CONVERSION_API_KEY: apiKey ?? undefined,
			};
			return run(instance);
		});
	return {
		stub,
		store: (expiresAt = Date.now() + 60 * 60_000) => withKey((instance) => instance.store(CLICK_ID, expiresAt)),
		reportClaim: (projectID = 'proj_1') => withKey((instance) => instance.reportClaim(projectID)),
		alarm: () => withKey((instance) => instance.alarm()),
		stored: () => runInDurableObject(stub, async (_, state) => Object.fromEntries(await state.storage.list())),
		alarmTime: () => runInDurableObject(stub, (_, state) => state.storage.getAlarm()),
	};
}

function freebuffAnswers(...responses: Array<Response | Error>) {
	const fetchMock = vi.spyOn(globalThis, 'fetch');
	for (const response of responses) {
		if (response instanceof Error) {
			fetchMock.mockRejectedValueOnce(response);
		} else {
			fetchMock.mockResolvedValueOnce(response);
		}
	}
	return fetchMock;
}

const sentBody = (fetchMock: ReturnType<typeof freebuffAnswers>, call = 0) =>
	JSON.parse((fetchMock.mock.calls[call]?.[1] as RequestInit).body as string);

beforeEach(() => {
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('parseFreebuffClickId', () => {
	it('keeps a well-formed click id exactly as received, up to 512 characters', () => {
		const longest = `bfc_${'a'.repeat(508)}`;
		expect(parseFreebuffClickId(CLICK_ID)).toBe(CLICK_ID);
		expect(parseFreebuffClickId(longest)).toBe(longest);
	});

	it('drops a value that is too long, malformed or not a string', () => {
		expect(parseFreebuffClickId(`bfc_${'a'.repeat(509)}`)).toBeUndefined();
		expect(parseFreebuffClickId('not-a-click-id')).toBeUndefined();
		expect(parseFreebuffClickId('bfc_has space')).toBeUndefined();
		expect(parseFreebuffClickId(` ${CLICK_ID}`)).toBeUndefined();
		expect(parseFreebuffClickId(42)).toBeUndefined();
		expect(parseFreebuffClickId(undefined)).toBeUndefined();
	});
});

describe('FreebuffClick', () => {
	it('reports a claim once, with the stored click id and a stable event id', async () => {
		const fetchMock = freebuffAnswers(Response.json({ accepted: true, campaignId: 'c1' }));
		const project = click();
		await project.store();

		expect(await project.reportClaim('proj_1')).toBe('reported');
		expect(await project.alarmTime()).toBeNull();

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(FREEBUFF_URL);
		expect(init.headers).toEqual({
			Authorization: 'Bearer fbadv_test_key',
			'Content-Type': 'application/json',
		});
		expect(sentBody(fetchMock)).toEqual({
			clickId: CLICK_ID,
			eventType: 'signup_completed',
			eventId: 'signup_completed:prisma:proj_1',
			occurredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
		});
		expect(await project.stored()).toEqual({});

		expect(await project.reportClaim('proj_1')).toBe('no-click');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('treats a conversion Freebuff already holds as reported', async () => {
		freebuffAnswers(Response.json({ accepted: true, deduped: true }));
		const project = click();
		await project.store();

		expect(await project.reportClaim()).toBe('reported');
		expect(await project.stored()).toEqual({});
	});

	it('does not report a database that has no click id', async () => {
		const fetchMock = freebuffAnswers();

		expect(await click().reportClaim()).toBe('no-click');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('does not report storing a click id as a conversion', async () => {
		const fetchMock = freebuffAnswers();
		const project = click();

		await project.store();

		expect(fetchMock).not.toHaveBeenCalled();
		expect(await project.stored()).toEqual({ clickId: CLICK_ID });
	});

	it('deletes the click id of an unclaimed database when it expires', async () => {
		const fetchMock = freebuffAnswers();
		const project = click();
		const expiresAt = Date.now() + 30 * 60_000;
		await project.store(expiresAt);

		expect(await project.alarmTime()).toBe(expiresAt);
		await project.alarm();

		expect(await project.stored()).toEqual({});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it.each([
		['a server error', new Response('down', { status: 503 })],
		['a rate limit', new Response('slow down', { status: 429 })],
		['a timeout', new DOMException('timed out', 'TimeoutError')],
	])('retries after %s with the same event id and time', async (_, failure) => {
		const fetchMock = freebuffAnswers(failure, Response.json({ accepted: true }));
		const project = click();
		await project.store();

		expect(await project.reportClaim()).toBe('retrying');
		expect(await project.alarmTime()).toBeGreaterThan(Date.now());

		await project.alarm();

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(sentBody(fetchMock, 1)).toEqual(sentBody(fetchMock, 0));
		expect(await project.stored()).toEqual({});
	});

	it('gives up after the last retry and deletes the click id', async () => {
		const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('down', { status: 503 }));
		const project = click();
		await project.store();

		expect(await project.reportClaim()).toBe('retrying');
		for (let retry = 0; retry < 4; retry++) {
			await project.alarm();
		}

		expect(fetchMock).toHaveBeenCalledTimes(5);
		expect(await project.stored()).toEqual({});
		expect(await project.alarmTime()).toBeNull();
	});

	it.each([
		[400, 'invalid_click_id'],
		[404, 'unknown_click'],
		[409, 'duplicate_event_id'],
		[422, 'outside_attribution_window'],
	])('does not retry a report Freebuff refuses with %i %s', async (status, error) => {
		const fetchMock = freebuffAnswers(Response.json({ error }, { status }));
		const project = click();
		await project.store();

		expect(await project.reportClaim()).toBe('failed');
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(await project.stored()).toEqual({});
	});

	it('sends nothing without an API key and deletes the click id at expiry', async () => {
		const fetchMock = freebuffAnswers();
		const project = click({ apiKey: null });
		await project.store();

		expect(await project.reportClaim()).toBe('no-api-key');
		expect(fetchMock).not.toHaveBeenCalled();

		await project.alarm();
		expect(await project.stored()).toEqual({});
	});

	it('never logs the click id or the API key', async () => {
		const logs = (['log', 'info', 'warn', 'error'] as const).map((level) =>
			vi.spyOn(console, level).mockImplementation(() => {}),
		);
		freebuffAnswers(new Response(`rejected ${CLICK_ID}`, { status: 400 }), new Error(`failed for ${CLICK_ID}`));
		const first = click();
		await first.store();
		await first.reportClaim();
		const second = click();
		await second.store();
		await second.reportClaim();

		const logged = JSON.stringify(logs.flatMap((log) => log.mock.calls));
		expect(logs.flatMap((log) => log.mock.calls)).toHaveLength(2);
		expect(logged).not.toContain(CLICK_ID);
		expect(logged).not.toContain('fbadv_test_key');
	});
});

describe('POST /create with a Freebuff click id', () => {
	const mockEnv = {
		...env,
		INTEGRATION_TOKEN: 'test-token',
		CREATE_DB_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
		PROGRAMMATIC_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
		CREATE_DB_DATASET: { writeDataPoint: vi.fn().mockResolvedValue(undefined) },
		DELETE_DB_WORKFLOW: { create: vi.fn().mockResolvedValue(undefined) },
		DELETE_STALE_WORKFLOW: { create: vi.fn().mockResolvedValue(undefined) },
	};

	async function create(projectId: string, body: Record<string, unknown>) {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ data: { id: projectId } }), { status: 201 }));
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			new Request('https://worker.example.com/create', {
				method: 'POST',
				body: JSON.stringify({ region: 'us-east-1', name: 'my-db', ...body }),
				headers: { 'Content-Type': 'application/json' },
			}),
			mockEnv as any,
			ctx,
		);
		const stub = namespace.get(namespace.idFromName(projectId));
		// Read before the background tasks finish: the click id is stored before the response.
		const stored = await runInDurableObject(stub, async (_, state) => Object.fromEntries(await state.storage.list()));
		await waitOnExecutionContext(ctx);
		return {
			response,
			fetchMock,
			stored,
			alarmTime: await runInDurableObject(stub, (_, state) => state.storage.getAlarm()),
			runAlarm: () => runDurableObjectAlarm(stub),
		};
	}

	it('keeps the click id for the project until the database expires', async () => {
		const before = Date.now();
		const { response, stored, alarmTime, runAlarm } = await create('proj_with_click', {
			freebuffClickId: CLICK_ID,
			ttlMs: 60 * 60_000,
		});

		expect(response.status).toBe(201);
		expect(stored).toEqual({ clickId: CLICK_ID });
		expect(alarmTime).toBeGreaterThanOrEqual(before + 60 * 60_000);
		expect(alarmTime).toBeLessThan(before + 61 * 60_000);
		expect(await runAlarm()).toBe(true);
	});

	it('sends the click id to no one and returns it to no one', async () => {
		const { response, fetchMock } = await create('proj_private_click', { freebuffClickId: CLICK_ID });

		expect(await response.text()).not.toContain(CLICK_ID);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(CLICK_ID);
	});

	it('creates the database and stores nothing without a click id', async () => {
		const { response, stored } = await create('proj_without_click', {});

		expect(response.status).toBe(201);
		expect(stored).toEqual({});
	});

	it('creates the database and stores nothing for a malformed click id', async () => {
		const { response, stored } = await create('proj_bad_click', { freebuffClickId: 'tampered' });

		expect(response.status).toBe(201);
		expect(stored).toEqual({});
	});
});

describe('reportFreebuffClaim', () => {
	it('finds the click id of the claimed project and of no other', async () => {
		const fetchMock = freebuffAnswers();
		const projectID = `proj_${crypto.randomUUID()}`;
		await namespace.get(namespace.idFromName(projectID)).store(CLICK_ID, Date.now() + 60 * 60_000);
		const createDbWorker = new CreateDbWorker(createExecutionContext(), env as any);

		expect(await createDbWorker.reportFreebuffClaim(`proj_${crypto.randomUUID()}`)).toBe('no-click');
		// The test worker has no API key, so the report stops once the click id is found.
		expect(await createDbWorker.reportFreebuffClaim(projectID)).toBe('no-api-key');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('is not reachable over HTTP', async () => {
		const ctx = createExecutionContext();
		const response = await worker.fetch(
			new Request('https://worker.example.com/reportFreebuffClaim', {
				method: 'POST',
				body: JSON.stringify(['proj_1']),
			}),
			{ ...env, CREATE_DB_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } } as any,
			ctx,
		);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(405);
	});
});
