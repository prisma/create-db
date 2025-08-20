import { NextRequest, NextResponse } from "next/server";
import { createPrismaPostgresHttpClient } from "@prisma/studio-core/data/ppg";
import { serializeError } from "@prisma/studio-core/data/bff";

export async function POST(request: NextRequest) {
  try {
    // 1. Extract the query and custom data from the request
    const body = (await request.json()) as { query: any };
    const { query } = body;

    // 2. Get connection string from custom header
    const connectionString = request.headers.get("X-Connection-String");

    if (!connectionString) {
      return NextResponse.json([
        serializeError(new Error("Connection string not provided")),
      ]);
    }

    // 3. Execute the query against Prisma Postgres
    const [error, results] = await createPrismaPostgresHttpClient({
      url: connectionString,
    }).execute(query);

    // 4. Return results or errors
    if (error) {
      return NextResponse.json([serializeError(error)]);
    }

    return NextResponse.json([null, results]);
  } catch (error) {
    console.error("Studio API error:", error);
    return NextResponse.json([serializeError(error as Error)]);
  }
}
