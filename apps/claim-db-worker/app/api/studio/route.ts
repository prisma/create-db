import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { serializeError, type StudioBFFRequest } from "@prisma/studio-core/data/bff";
import {
  createPostgresJSConnectionConfig,
  createPostgresJSExecutor,
} from "@prisma/studio-core/data/postgresjs";

/** Studio's backend: runs the queries Studio sends against the user's database. */
export async function POST(request: NextRequest) {
  const connectionString = request.headers.get("X-Connection-String");
  if (!connectionString) {
    return NextResponse.json([serializeError(new Error("Connection string not provided"))]);
  }

  let payload: StudioBFFRequest;
  try {
    payload = (await request.json()) as StudioBFFRequest;
  } catch (parseError) {
    return NextResponse.json([
      serializeError(
        new Error(
          `Invalid JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        )
      ),
    ]);
  }

  // One client per request: a worker can't keep connections between requests.
  const config = createPostgresJSConnectionConfig(connectionString);
  const sql = postgres(config.connectionString, { ...config.options, max: 1 });
  const executor = createPostgresJSExecutor(sql);

  try {
    if (payload.procedure === "query") {
      const [error, result] = await executor.execute(payload.query, {
        schema: payload.schema,
      });
      return NextResponse.json([error ? serializeError(error) : null, result]);
    }

    if (payload.procedure === "transaction" && executor.executeTransaction) {
      const [error, result] = await executor.executeTransaction(payload.queries);
      return NextResponse.json([error ? serializeError(error) : null, result]);
    }

    if (payload.procedure === "sql-lint" && executor.lintSql) {
      const [error, result] = await executor.lintSql({
        schema: payload.schema,
        schemaVersion: payload.schemaVersion,
        sql: payload.sql,
      });
      return NextResponse.json([error ? serializeError(error) : null, result]);
    }

    return new NextResponse(`${payload.procedure} is not supported`, { status: 501 });
  } catch (error) {
    console.error("Studio API error:", error);
    return NextResponse.json([serializeError(error as Error)]);
  } finally {
    await sql.end();
  }
}
