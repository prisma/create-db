import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/auth/url/route";
import { claimCampaign } from "../lib/claim-campaign";

const authUrlFor = async (body: unknown) => {
  const response = await POST(
    new NextRequest("http://localhost:3000/api/auth/url", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );
  const { authUrl } = (await response.json()) as { authUrl: string };
  return new URL(authUrl);
};

describe("auth url API", () => {
  const originalClientId = process.env.CLIENT_ID;
  beforeEach(() => {
    process.env.CLIENT_ID = "client-1";
  });
  afterEach(() => {
    process.env.CLIENT_ID = originalClientId;
  });

  it("passes the CLI's command, medium and output mode on to sign-in", async () => {
    const url = await authUrlFor({
      redirectUri: "http://localhost:3000/api/auth/callback?projectID=p",
      utm: { utm_source: "create-pg", utm_medium: "cli", utm_content: "json" },
    });
    expect(url.origin).toBe("https://auth.prisma.io");
    expect(url.searchParams.get("utm_source")).toBe("create-pg");
    expect(url.searchParams.get("utm_medium")).toBe("cli");
    expect(url.searchParams.get("utm_content")).toBe("json");
  });

  it("never passes a custom user agent or env-file value on", async () => {
    const url = await authUrlFor({
      redirectUri: "http://localhost:3000/api/auth/callback?projectID=p",
      utm: { utm_source: "Jane Doe/acme-secret-app", utm_medium: "cli" },
    });
    expect(url.searchParams.get("utm_source")).toBe("create-db");
    expect(url.search).not.toMatch(/jane|acme/i);
  });

  it("keeps the old tags for a page without the CLI's", async () => {
    const url = await authUrlFor({
      redirectUri: "http://localhost:3000/api/auth/callback?projectID=p",
    });
    expect(url.searchParams.get("utm_source")).toBe("create-db-frontend");
    expect(url.searchParams.get("utm_medium")).toBe("claim_button");
    expect(url.searchParams.has("utm_content")).toBe(false);
  });
});

describe("claimCampaign", () => {
  it.each([
    [{ utm_source: "create-db", utm_medium: "cli" }, { utm_source: "create-db", utm_medium: "cli" }],
    [{ utm_source: " Create-Postgres ", utm_medium: "CLI", utm_content: "quiet" }, { utm_source: "create-postgres", utm_medium: "cli", utm_content: "quiet" }],
    [{ utm_source: "create-db-frontend", utm_medium: "claim_button" }, { utm_source: "create-db-frontend", utm_medium: "claim_button" }],
    [{ utm_source: "claude-code/my-app", utm_medium: "cli" }, { utm_source: "create-db", utm_medium: "cli" }],
    [{ utm_source: "x", utm_medium: "email", utm_content: "free text" }, { utm_source: "create-db-frontend", utm_medium: "claim_button" }],
    [null, { utm_source: "create-db-frontend", utm_medium: "claim_button" }],
    ["not an object", { utm_source: "create-db-frontend", utm_medium: "claim_button" }],
  ])("normalises %j", (input, expected) => {
    expect(claimCampaign(input)).toEqual(expected);
  });
});
