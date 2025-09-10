import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { sendAnalyticsEvent } from "@/lib/analytics";
import { getClientIP } from "@/lib/utils";

export async function GET(request: NextRequest) {
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

  const projectID = url.searchParams.get("projectID");

  if (!projectID || projectID === "undefined") {
    return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
  }

  await sendAnalyticsEvent("create_db:claim_viewed", {
    "project-id": projectID,
  });

  return NextResponse.json({ success: true });
}
