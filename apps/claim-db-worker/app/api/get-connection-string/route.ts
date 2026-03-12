import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { databaseId } = (await request.json()) as { databaseId: string };

  const response = await fetch(
    `https://api.prisma.io/v1/databases/${databaseId}/connections`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INTEGRATION_TOKEN}`,
      },
      body: JSON.stringify({ databaseId, name: "string" }),
    }
  );
  const data = await response.json();
  return NextResponse.json(data);
}
