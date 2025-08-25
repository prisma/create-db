import { NextRequest, NextResponse } from "next/server";
import { createPrismaPostgresHttpClient } from "@prisma/studio-core/data/ppg";
import { serializeError } from "@prisma/studio-core/data/bff";

export async function POST(request: NextRequest) {
  try {
    // 1. Check if request has content
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json([
        serializeError(new Error("Content-Type must be application/json")),
      ]);
    }

    // 2. Extract the query and custom data from the request
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === "") {
        return NextResponse.json([
          serializeError(new Error("Request body is empty")),
        ]);
      }
      body = JSON.parse(text) as { query: any };
    } catch (parseError) {
      return NextResponse.json([
        serializeError(
          new Error(
            `Invalid JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
          )
        ),
      ]);
    }

    const { query } = body;

    if (!query) {
      return NextResponse.json([
        serializeError(new Error("Query is required in request body")),
      ]);
    }

    // 3. Get connection string from custom header
    const connectionString = request.headers.get("X-Connection-String");

    if (!connectionString) {
      return NextResponse.json([
        serializeError(new Error("Connection string not provided")),
      ]);
    }

    // 4. Execute the query against Prisma Postgres
    const [error, results] = await createPrismaPostgresHttpClient({
      url: connectionString,
    }).execute(query);

    // 5. Return results or errors
    if (error) {
      return NextResponse.json([serializeError(error)]);
    }

    return NextResponse.json([null, results]);
  } catch (error) {
    console.error("Studio API error:", error);
    return NextResponse.json([serializeError(error as Error)]);
  }
}
