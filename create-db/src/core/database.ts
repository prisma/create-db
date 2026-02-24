import { randomUUID } from "crypto";
import type { CreateDatabaseResult, ApiResponse } from "../types.js";
import { sendAnalytics } from "../utils/analytics.js";

export function getCommandName(): string {
  const executable = process.argv[1] || "create-db";
  if (executable.includes("create-pg")) return "create-pg";
  if (executable.includes("create-postgres")) return "create-postgres";
  return "create-db";
}

export async function createDatabaseCore(
  region: string,
  createDbWorkerUrl: string,
  claimDbWorkerUrl: string,
  userAgent?: string,
  cliRunId?: string,
  source?: "programmatic" | "cli",
  ttlMs?: number
): Promise<CreateDatabaseResult> {
  const name = new Date().toISOString();
  const runId = cliRunId ?? randomUUID();

  const payload: Record<string, unknown> = {
    region,
    name,
    utm_source: getCommandName(),
    userAgent,
    source: source || "cli",
  };

  if (typeof ttlMs === "number" && Number.isFinite(ttlMs) && ttlMs > 0) {
    payload.ttlMs = Math.floor(ttlMs);
  }

  const resp = await fetch(`${createDbWorkerUrl}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (resp.status === 429) {
    void sendAnalytics(
      "create_db:database_creation_failed",
      { region, "error-type": "rate_limit", "status-code": 429 },
      runId,
      createDbWorkerUrl
    );

    // Try to parse the rate limit response from the server
    try {
      const errorData = await resp.json();
      if (errorData.error === "RATE_LIMIT_EXCEEDED" && errorData.rateLimitInfo) {
        return {
          success: false,
          error: "RATE_LIMIT_EXCEEDED",
          message: errorData.message,
          rateLimitInfo: errorData.rateLimitInfo,
          status: 429,
        };
      }
    } catch {
      // If parsing fails, fall through to generic message
    }

    return {
      success: false,
      error: "rate_limit_exceeded",
      message:
        "We're experiencing a high volume of requests. Please try again later.",
      status: 429,
    };
  }

  let result: ApiResponse;
  let raw = "";
  try {
    raw = await resp.text();
    result = JSON.parse(raw) as ApiResponse;
  } catch {
    void sendAnalytics(
      "create_db:database_creation_failed",
      { region, "error-type": "invalid_json", "status-code": resp.status },
      runId,
      createDbWorkerUrl
    );
    return {
      success: false,
      error: "invalid_json",
      message: "Unexpected response from create service.",
      raw,
      status: resp.status,
    };
  }

  if (result.error) {
    void sendAnalytics(
      "create_db:database_creation_failed",
      {
        region,
        "error-type": "api_error",
        "error-message": result.error.message,
      },
      runId,
      createDbWorkerUrl
    );
    return {
      success: false,
      error: "api_error",
      message: result.error.message || "Unknown error",
      details: result.error,
      status: result.error.status ?? resp.status,
    };
  }

  const database = result.data?.database ?? result.databases?.[0];
  const projectId = result.data?.id ?? result.id ?? "";

  const apiKeys = database?.apiKeys;
  const directConnDetails = result.data
    ? apiKeys?.[0]?.directConnection
    : result.databases?.[0]?.apiKeys?.[0]?.ppgDirectConnection;

  const directUser = directConnDetails?.user
    ? encodeURIComponent(String(directConnDetails.user))
    : "";
  const directPass = directConnDetails?.pass
    ? encodeURIComponent(String(directConnDetails.pass))
    : "";
  const directHost = directConnDetails?.host;
  const directPort = directConnDetails?.port
    ? `:${directConnDetails.port}`
    : "";
  const directDbName = directConnDetails?.database || "postgres";

  const connectionString =
    directConnDetails && directHost
      ? `postgresql://${directUser}:${directPass}@${directHost}${directPort}/${directDbName}?sslmode=require`
      : null;

  const claimUrl = `${claimDbWorkerUrl}/claim?projectID=${projectId}&utm_source=${userAgent || getCommandName()}&utm_medium=cli`;

  const ttlMsToUse =
    typeof ttlMs === "number" && Number.isFinite(ttlMs) && ttlMs > 0
      ? Math.floor(ttlMs)
      : 24 * 60 * 60 * 1000;
  const expiryDate = new Date(Date.now() + ttlMsToUse);

  void sendAnalytics(
    "create_db:database_created",
    { region, utm_source: getCommandName() },
    runId,
    createDbWorkerUrl
  );

  return {
    success: true,
    connectionString,
    claimUrl,
    deletionDate: expiryDate.toISOString(),
    region: database?.region?.id || region,
    name: database?.name ?? name,
    projectId,
    userAgent,
  };
}
