import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const env = getEnv();
  const { searchParams } = new URL(request.url);

  const rateLimitResult = await env.CLAIM_DB_RATE_LIMITER.limit({
    key: request.url,
  });
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  async function sendPosthogEvent(
    event: string,
    properties: Record<string, any>
  ) {
    const POSTHOG_API_KEY = env.POSTHOG_API_KEY;
    const POSTHOG_PROXY_HOST = env.POSTHOG_API_HOST;

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
  }

  const projectID = searchParams.get("projectID");

  if (!projectID || projectID === "undefined") {
    return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
  }

  await sendPosthogEvent("create_db:claim_page_viewed", {
    "project-id": projectID,
    "utm-source": searchParams.get("utm_source") || "unknown",
    "utm-medium": searchParams.get("utm_medium") || "unknown",
  });

  return NextResponse.json({ success: true });
}
