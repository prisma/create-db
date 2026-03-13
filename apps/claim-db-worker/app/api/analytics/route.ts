import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { sendAnalyticsEvent } from "@/lib/analytics";
import { buildRateLimitKey } from "@/lib/server/ratelimit";

export async function POST(request: NextRequest) {
  const env = getEnv();
  const url = new URL(request.url);
  const key = buildRateLimitKey(request);

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

  try {
    const body = (await request.json()) as {
      event?: string;
      properties?: Record<string, unknown>;
    };

    const event = body.event?.trim();

    if (!event) {
      return NextResponse.json(
        { error: "Event name required" },
        { status: 400 }
      );
    }

    if (!event.startsWith("create_db:")) {
      return NextResponse.json(
        { error: "Event must start with create_db:" },
        { status: 400 }
      );
    }

    await sendAnalyticsEvent(event, body.properties || {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send PostHog event:", error);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
