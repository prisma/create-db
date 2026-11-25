import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/api/claim/route";

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({
    CLAIM_DB_RATE_LIMITER: {
      limit: vi.fn(() => Promise.resolve({ success: true })),
    },
  })),
}));

vi.mock("@/lib/freebuff", () => ({
  reportFreebuffClaim: vi.fn(),
}));

describe("claim view API", () => {
  it("does not report a conversion when a claim link is opened", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/claim?projectID=proj_1&utm_source=freebuff/agentic&utm_medium=cli"
      )
    );

    expect(response.status).toBe(200);
    const { reportFreebuffClaim } = await import("@/lib/freebuff");
    expect(reportFreebuffClaim).not.toHaveBeenCalled();
  });
});
