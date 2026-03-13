import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosthogEventCapture, EventCaptureError } from '../src/analytics';

describe('PosthogEventCapture', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('does nothing when POSTHOG_API_HOST is missing', async () => {
		const fetchSpy = vi.spyOn(global, 'fetch');
		const capture = new PosthogEventCapture({ POSTHOG_API_KEY: 'key' });
		await capture.capture('test_event');
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('does nothing when POSTHOG_API_KEY is missing', async () => {
		const fetchSpy = vi.spyOn(global, 'fetch');
		const capture = new PosthogEventCapture({ POSTHOG_API_HOST: 'https://posthog.example.com' });
		await capture.capture('test_event');
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('sends a POST request to the capture endpoint', async () => {
		const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
		const capture = new PosthogEventCapture({
			POSTHOG_API_HOST: 'https://posthog.example.com',
			POSTHOG_API_KEY: 'phc_testkey',
		});

		await capture.capture('db_created', { region: 'us-east-1' });

		expect(fetchSpy).toHaveBeenCalledOnce();
		const [url, init] = fetchSpy.mock.calls[0];
		expect(url).toBe('https://posthog.example.com/capture');
		expect(init?.method).toBe('POST');

		const body = JSON.parse(init?.body as string);
		expect(body.event).toBe('db_created');
		expect(body.properties.region).toBe('us-east-1');
		expect(body.properties.$process_person_profile).toBe(false);
	});

	it('strips trailing slash from host', async () => {
		const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
		const capture = new PosthogEventCapture({
			POSTHOG_API_HOST: 'https://posthog.example.com///',
			POSTHOG_API_KEY: 'key',
		});
		await capture.capture('event');
		const [url] = fetchSpy.mock.calls[0];
		expect(url).toBe('https://posthog.example.com/capture');
	});

	it('throws EventCaptureError on non-ok response', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 500, statusText: 'Internal Server Error' }));
		const capture = new PosthogEventCapture({
			POSTHOG_API_HOST: 'https://posthog.example.com',
			POSTHOG_API_KEY: 'key',
		});
		await expect(capture.capture('event')).rejects.toBeInstanceOf(EventCaptureError);
	});
});
