class EventCaptureError extends Error {
	constructor(
		public readonly event: string,
		public readonly statusCode: number,
		public readonly statusText: string,
	) {
		super(`Failed to submit PostHog event '${event}': ${statusCode} ${statusText}`);
	}
}

interface AnalyticsProperties {
	[key: string]: any;
}

class PosthogEventCapture {
	constructor(private env: { POSTHOG_API_HOST?: string; POSTHOG_API_KEY?: string }) {}

	async capture(eventName: string, properties: AnalyticsProperties = {}) {
		const host = this.env.POSTHOG_API_HOST?.replace(/\/+$/, '');
		const key = this.env.POSTHOG_API_KEY;

		if (!host || !key) {
			return;
		}

		const POSTHOG_CAPTURE_URL = `${host}/capture`;
		const POSTHOG_KEY = key;

		const payload = {
			api_key: POSTHOG_KEY,
			event: eventName,
			distinct_id: crypto.randomUUID(),
			properties: {
				$process_person_profile: false,
				...properties,
			},
		};

		try {
			const response = await fetch(POSTHOG_CAPTURE_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new EventCaptureError(eventName, response.status, response.statusText);
			}

			console.log(`${eventName}: Success`);
		} catch (error) {
			console.error(`${eventName}: Failed - ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}
}

export { PosthogEventCapture, EventCaptureError };
