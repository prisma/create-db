import { randomUUID } from "crypto";

class EventCaptureError extends Error {
  constructor(event, status) {
    super(`Failed to submit PostHog event '${event}': ${status}`);
  }
}

class PosthogEventCapture {
  async capture(eventName, properties = {}) {
    const POSTHOG_API_HOST = process.env.POSTHOG_API_HOST;
    const POSTHOG_KEY = process.env.POSTHOG_API_KEY;

    if (
      !POSTHOG_API_HOST ||
      !POSTHOG_KEY ||
      POSTHOG_API_HOST.trim() === "" ||
      POSTHOG_KEY.trim() === ""
    ) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Analytics disabled: missing POSTHOG_API_HOST or POSTHOG_API_KEY."
        );
      }
      return;
    }

    const POSTHOG_CAPTURE_URL = `${POSTHOG_API_HOST.replace(/\/+$/, "")}/capture`;

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
      if (process.env.NODE_ENV === "development") {
        console.error("Analytics error:", error.message);
      }
    }
  }
}

// Create a singleton instance
const analytics = new PosthogEventCapture();

export { analytics, EventCaptureError };
