import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { sendAnalyticsEvent } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const env = getEnv();
  const { searchParams } = new URL(request.url);

  const rateLimitResult = await env.CLAIM_DB_RATE_LIMITER.limit({
    key: request.url,
  });
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const projectID = searchParams.get("projectID");

  if (!projectID || projectID === "undefined") {
    return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
  }

  await sendAnalyticsEvent("create_db:claim_viewed", {
    "project-id": projectID,
  });

  return NextResponse.json({ success: true });
}
