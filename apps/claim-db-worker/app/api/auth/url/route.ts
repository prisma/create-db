import { NextRequest, NextResponse } from "next/server";
import { claimCampaign } from "@/lib/claim-campaign";

export async function POST(request: NextRequest) {
  const body: { redirectUri: string; utm?: unknown } = await request.json();
  const redirectUri = body.redirectUri;
  const clientId = process.env.CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Client ID not configured" },
      { status: 500 }
    );
  }

  const searchParams = new URLSearchParams();
  searchParams.set("client_id", clientId);
  searchParams.set("redirect_uri", redirectUri.toString());
  searchParams.set("response_type", "code");
  searchParams.set("scope", "workspace:admin");
  searchParams.set("state", generateState());
  // The claim page's own tags, from the CLI that made the database. Only
  // known command names pass; see `claimCampaign`.
  for (const [key, value] of Object.entries(claimCampaign(body.utm))) {
    if (value) searchParams.set(key, value);
  }

  const authUrl = `https://auth.prisma.io/authorize?${searchParams.toString()}`;

  return NextResponse.json({ authUrl });
}

function generateState(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
