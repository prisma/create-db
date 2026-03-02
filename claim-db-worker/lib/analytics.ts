import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";

type AnalyticsProperties = Record<string, unknown>;

function isCreateDbEvent(event: string) {
  return event.startsWith("create_db:");
}

export async function sendAnalyticsEvent(
  event: string,
  properties: AnalyticsProperties = {},
  request?: NextRequest
): Promise<void> {
  if (!isCreateDbEvent(event)) {
    return;
  }

  const env = getEnv();
  const host = env.POSTHOG_PROXY_HOST?.replace(/\/+$/, "");
  const key = env.POSTHOG_API_KEY;

  if (!host || !key) {
    return;
  }

  const { distinct_id: distinctIdProp, ...restProperties } = properties;
  const projectId =
    typeof restProperties["project-id"] === "string"
      ? restProperties["project-id"]
      : undefined;
  const distinctId =
    typeof distinctIdProp === "string" && distinctIdProp.length > 0
      ? distinctIdProp
      : projectId
        ? `project:${projectId}`
        : "claim-db-worker";

  const payload = {
    api_key: key,
    event,
    distinct_id: distinctId,
    properties: {
      $process_person_profile: false,
      ...restProperties,
      ...(request
        ? {
            $current_url: request.url,
            $user_agent: request.headers.get("user-agent") ?? undefined,
          }
        : {}),
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${host}/e`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Failed to send PostHog event '${event}': ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error(
      `Failed to send PostHog event '${event}':`,
      error instanceof Error ? error.message : String(error)
    );
  }
}
