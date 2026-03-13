import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = (await request.json()) as { projectId: string };
    const response = await fetch(
      `https://api.prisma.io/v1/projects/${projectId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INTEGRATION_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: true });
    }

    return NextResponse.json({ error: false });
  } catch (error) {
    console.error("Error checking database status:", error);
    return NextResponse.json({ error: true });
  }
}
