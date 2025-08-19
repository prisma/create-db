import { getEnv } from "./env";

export async function sendPosthogEvent(
  event: string,
  properties: Record<string, any>
) {
  const env = getEnv();
  const POSTHOG_API_KEY = env.POSTHOG_API_KEY;
  const POSTHOG_PROXY_HOST = env.POSTHOG_API_HOST;

  // Skip analytics if PostHog is not configured
  if (!POSTHOG_API_KEY || !POSTHOG_PROXY_HOST) {
    return;
  }

  try {
    await fetch(`${POSTHOG_PROXY_HOST}/e`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        event,
        properties,
        distinct_id: "web-claim",
      }),
    });
  } catch (error) {
    console.error("Failed to send PostHog event:", error);
  }
}

export async function trackClaimSuccess(projectID: string) {
  const env = getEnv();

  try {
    env.CREATE_DB_DATASET.writeDataPoint({
      blobs: ["database_claimed"],
      indexes: ["claim_db"],
    });
  } catch (error) {
    console.error("Failed to write analytics data point:", error);
  }

  await sendPosthogEvent("create_db:claim_successful", {
    "project-id": projectID,
  });
}

export async function trackClaimFailure(
  projectID: string,
  status: number,
  error: string
) {
  await sendPosthogEvent("create_db:claim_failed", {
    "project-id": projectID,
    status,
    error,
  });
}
