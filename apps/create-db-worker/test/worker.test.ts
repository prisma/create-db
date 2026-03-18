import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index';

const mockEnv = {
	...env,
	INTEGRATION_TOKEN: 'test-token',
	CREATE_DB_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
	PROGRAMMATIC_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
	CREATE_DB_DATASET: { writeDataPoint: vi.fn().mockResolvedValue(undefined) },
	DELETE_DB_WORKFLOW: { create: vi.fn().mockResolvedValue(undefined) },
	DELETE_STALE_WORKFLOW: { create: vi.fn().mockResolvedValue(undefined) },
	POSTHOG_API_KEY: undefined,
	POSTHOG_API_HOST: undefined,
};

function makeRequest(path: string, options: RequestInit = {}) {
	return new Request(`https://worker.example.com${path}`, options);
}

describe('GET /health', () => {
	it('returns 200 with status ok', async () => {
		const ctx = createExecutionContext();
		const res = await worker.fetch(makeRequest('/health'), mockEnv as any, ctx);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(200);
		const body = await res.json<{ status: string; service: string }>();
		expect(body.status).toBe('ok');
		expect(body.service).toBe('create-db');
	});
});

describe('GET /test', () => {
	it('returns 200 with rate limit pass message', async () => {
		const ctx = createExecutionContext();
		const res = await worker.fetch(makeRequest('/test'), mockEnv as any, ctx);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(200);
		const body = await res.json<{ status: string }>();
		expect(body.status).toBe('success');
	});
});


describe('POST /create', () => {
	beforeEach(() => {
		vi.spyOn(global, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ data: { id: 'proj_123' } }), { status: 201 }),
		);
	});

	it('returns 400 for invalid JSON', async () => {
		const ctx = createExecutionContext();
		const res = await worker.fetch(
			makeRequest('/create', { method: 'POST', body: 'bad' }),
			mockEnv as any,
			ctx,
		);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(400);
	});

	it('returns 400 when region is missing', async () => {
		const ctx = createExecutionContext();
		const res = await worker.fetch(
			makeRequest('/create', {
				method: 'POST',
				body: JSON.stringify({ name: 'my-db' }),
				headers: { 'Content-Type': 'application/json' },
			}),
			mockEnv as any,
			ctx,
		);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(400);
	});

	it('returns 400 when name is missing', async () => {
		const ctx = createExecutionContext();
		const res = await worker.fetch(
			makeRequest('/create', {
				method: 'POST',
				body: JSON.stringify({ region: 'us-east-1' }),
				headers: { 'Content-Type': 'application/json' },
			}),
			mockEnv as any,
			ctx,
		);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(400);
	});

	it('returns 400 for invalid ttlMs type', async () => {
		const ctx = createExecutionContext();
		const res = await worker.fetch(
			makeRequest('/create', {
				method: 'POST',
				body: JSON.stringify({ region: 'us-east-1', name: 'my-db', ttlMs: 'bad' }),
				headers: { 'Content-Type': 'application/json' },
			}),
			mockEnv as any,
			ctx,
		);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(400);
	});

	it('returns 400 for ttlMs out of range', async () => {
		const ctx = createExecutionContext();
		const res = await worker.fetch(
			makeRequest('/create', {
				method: 'POST',
				body: JSON.stringify({ region: 'us-east-1', name: 'my-db', ttlMs: 1000 }),
				headers: { 'Content-Type': 'application/json' },
			}),
			mockEnv as any,
			ctx,
		);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(400);
	});

	it('proxies the Prisma API response on success', async () => {
		const ctx = createExecutionContext();
		const res = await worker.fetch(
			makeRequest('/create', {
				method: 'POST',
				body: JSON.stringify({ region: 'us-east-1', name: 'my-db' }),
				headers: { 'Content-Type': 'application/json' },
			}),
			mockEnv as any,
			ctx,
		);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(201);
	});
});

describe('unknown routes', () => {
	it('returns 405 for unmatched paths', async () => {
		const ctx = createExecutionContext();
		const res = await worker.fetch(makeRequest('/unknown'), mockEnv as any, ctx);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(405);
	});
});

describe('rate limiting', () => {
	it('returns 429 when rate limiter blocks the request', async () => {
		const rateLimitedEnv = {
			...mockEnv,
			CREATE_DB_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) },
		};
		const ctx = createExecutionContext();
		const res = await worker.fetch(makeRequest('/create', { method: 'POST' }), rateLimitedEnv as any, ctx);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(429);
	});
});
