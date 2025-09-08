import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  const env = getEnv();

  const rateLimitResult = await env.CLAIM_DB_RATE_LIMITER.limit({
    key: request.url,
  });
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
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
