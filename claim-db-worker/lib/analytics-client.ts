"use client";

const DISTINCT_ID_STORAGE_KEY = "create_db:distinct_id";

function getDistinctId(): string {
  if (typeof window === "undefined") {
    return "claim-db-worker";
  }

  try {
    const existing = window.localStorage.getItem(DISTINCT_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const nextId = crypto.randomUUID();
    window.localStorage.setItem(DISTINCT_ID_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return "claim-db-worker";
  }
}

export async function sendAnalyticsEvent(
  event: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  if (!event.startsWith("create_db:")) {
    return;
  }

  try {
    const response = await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        event,
        properties: {
          ...properties,
          distinct_id: getDistinctId(),
        },
      }),
    });

    if (!response.ok && process.env.NODE_ENV === "development") {
      console.error("Failed to send analytics event:", response.status);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to send analytics event:", error);
    }
  }
}
