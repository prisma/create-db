import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { serializeError, type StudioBFFRequest } from "@prisma/studio-core/data/bff";
import {
  createPostgresJSConnectionConfig,
  createPostgresJSExecutor,
} from "@prisma/studio-core/data/postgresjs";

/**
 * The Prisma Postgres host the connection string points at, the only databases
 * create-db makes, or undefined for anything else.
 */
function prismaPostgresHost(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const isPrismaPostgres =
      (url.protocol === "postgres:" || url.protocol === "postgresql:") &&
      /^(?:[a-z0-9-]+\.)*db\.prisma\.io$/.test(url.hostname) &&
      (url.port === "" || url.port === "5432");
    return isPrismaPostgres ? url.hostname : undefined;
  } catch {
    return undefined;
  }
}

/** Studio's backend: runs the queries Studio sends against the user's database. */
export async function POST(request: NextRequest) {
  const connectionString = request.headers.get("X-Connection-String");
  if (!connectionString) {
    return NextResponse.json([serializeError(new Error("Connection string not provided"))]);
  }
  // This route is public, so it must not open connections to arbitrary hosts.
  const host = prismaPostgresHost(connectionString);
  if (!host) {
    return NextResponse.json([
      serializeError(new Error("Only Prisma Postgres connection strings are supported")),
    ]);
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
  const sql = postgres(config.connectionString, {
    ...config.options,
    // postgres.js parses the host itself (a comma means several hosts), so
    // pin the one checked above.
    host,
    port: 5432,
    max: 1,
    connect_timeout: 10,
  });
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
    // A failed close must not replace the response.
    await sql.end().catch((error: unknown) => {
      console.error("Failed to close the Studio connection:", error);
    });
  }
}
