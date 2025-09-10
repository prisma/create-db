import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getClientIP } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const env = getEnv();

  const url = new URL(request.url);
  const key = `${getClientIP(request)}:${request.url}`;

  // --- Simple rate limiting ---
  const { success } = await env.CLAIM_DB_RATE_LIMITER.limit({ key });
  if (!success) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Rate limit exceeded. Please try again later.",
        path: url.pathname,
      },
      { status: 429 }
    );
  }

  if (!env.POSTHOG_API_KEY || !env.POSTHOG_API_HOST) {
    return NextResponse.json({ success: true });
  }

  try {
    const {
      event,
      properties,
    }: { event: string; properties: Record<string, any> } =
      await request.json();

    if (!event) {
      return NextResponse.json(
        { error: "Event name required" },
        { status: 400 }
      );
    }

    await fetch(`${env.POSTHOG_API_HOST}/e`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        api_key: env.POSTHOG_API_KEY,
        event,
        properties: properties || {},
        distinct_id: "web-claim",
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send PostHog event:", error);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
