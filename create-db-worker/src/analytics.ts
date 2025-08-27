class EventCaptureError extends Error {
	constructor(event: string, status: string) {
		super(`Failed to submit PostHog event '${event}': ${status}`);
	}
}

interface AnalyticsProperties {
	[key: string]: any;
}

class PosthogEventCapture {
	constructor(private env: { POSTHOG_API_HOST?: string; POSTHOG_API_KEY?: string }) {}

	async capture(eventName: string, properties: AnalyticsProperties = {}) {
		const POSTHOG_CAPTURE_URL = this.env.POSTHOG_API_HOST + '/capture';
		const POSTHOG_KEY = this.env.POSTHOG_API_KEY;

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
				throw new EventCaptureError(eventName, response.statusText);
			}

			console.log(`${eventName}: Success`);
		} catch (error) {
			console.error(`${eventName}: Failed - ${error instanceof Error ? error.message : String(error)}`);
			throw error;
		}
	}
}

export { PosthogEventCapture, EventCaptureError };
