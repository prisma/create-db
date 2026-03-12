import type { NextRequest } from "next/server";

export function getClientIP(req: NextRequest): string {
  // OpenNext on CF Workers exposes the Request headers directly
  // Consider: prefer CF header in prod; only then fall back to XFF/X-Real-IP/Forwarded.
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown-ip"
  );
}

export function buildRateLimitKey(req: NextRequest) {
  const url = new URL(req.url);
  return `${req.method}:${getClientIP(req)}:${url.pathname}`;
}
