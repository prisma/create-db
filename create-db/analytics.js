import { randomUUID } from "crypto";

class EventCaptureError extends Error {
  constructor(event, status) {
    super(`Failed to submit PostHog event '${event}': ${status}`);
  }
}

class PosthogEventCapture {
  async capture(eventName, properties = {}) {
    const POSTHOG_CAPTURE_URL = process.env.POSTHOG_API_HOST + "/capture";
    const POSTHOG_KEY = process.env.POSTHOG_API_KEY;
    console.log("POSTHOG_KEY set?", !!POSTHOG_KEY);
    console.log("POSTHOG_CAPTURE_URL:", POSTHOG_CAPTURE_URL);
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

      // Log success message
      console.log(`${eventName}: Success`);
    } catch (error) {
      // Log all analytics errors for debugging
      console.error(`${eventName}: Failed - ${error.message}`);

      // Re-throw the error so calling code can handle it if needed
      throw error;
    }
  }
}

// Create a singleton instance
const analytics = new PosthogEventCapture();

export { analytics, EventCaptureError };
