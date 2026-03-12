import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body: { redirectUri: string } = await request.json();
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
  searchParams.set("utm_source", "create-db-frontend");
  searchParams.set("utm_medium", "claim_button");

  const authUrl = `https://auth.prisma.io/authorize?${searchParams.toString()}`;

  return NextResponse.json({ authUrl });
}

function generateState(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
