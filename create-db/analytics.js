import { randomUUID } from "crypto";

class EventCaptureError extends Error {
  constructor(event, status) {
    super(`Failed to submit PostHog event '${event}': ${status}`);
  }
}

class PosthogEventCapture {
  async capture(eventName, properties = {}) {
    const POSTHOG_CAPTURE_URL = process.env.POSTHOG_API_HOST
      ? process.env.POSTHOG_API_HOST + "/capture"
      : "https://proxyhog.prisma-data.net/capture";
    const POSTHOG_KEY =
      process.env.POSTHOG_API_KEY ||
      "phc_cmc85avbWyuJ2JyKdGPdv7dxXli8xLdWDBPbvIXWJfs";

    const payload = {
      api_key: POSTHOG_KEY,
      event: eventName,
      distinct_id: randomUUID(),
      properties: {
        $process_person_profile: false,
        ...properties,
      },
    };

    try {
      const response = await fetch(POSTHOG_CAPTURE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new EventCaptureError(eventName, response.statusText);
      }
    } catch (error) {
      // Silently fail analytics to not disrupt user experience
      if (process.env.NODE_ENV === "development") {
        console.error("Analytics error:", error.message);
      }
    }
  }
}

// Create a singleton instance
const analytics = new PosthogEventCapture();

export { analytics, EventCaptureError };
