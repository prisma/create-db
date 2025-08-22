import { NextRequest, NextResponse } from "next/server";

interface PrismaProject {
  id?: string;
  data?: {
    id: string;
    database: {
      id: string;
      connectionString: string;
      directConnection: {
        user: string;
        pass: string;
        host: string;
      };
    };
  };
  connectionString?: string;
  database_url?: string;
  [key: string]: unknown;
}

const CREATE_DB_WORKER_URL =
  process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io";

export async function POST(request: NextRequest) {
  try {
    const name = new Date().toISOString();

    const region = "us-east-1";

    const prismaResponse = await fetch(`${CREATE_DB_WORKER_URL}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region,
        name,
        utm_source: "drop",
      }),
    });

    if (!prismaResponse.ok) {
      throw new Error(
        `Prisma API error: ${prismaResponse.status} ${prismaResponse.statusText}`
      );
    }

    const result = (await prismaResponse.json()) as PrismaProject;
    console.log(
      "🚀 Original JSON output from /api/create-db:",
      JSON.stringify(result, null, 2)
    );
    return NextResponse.json({
      response: result,
      connectionString: result.connectionString || result.database_url,
      projectId: result.data?.id || result.id,
      databaseId: result.data?.database.id,
      region: region,
      name: name,
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create database", details: errorMessage },
      { status: 500 }
    );
  }
}
