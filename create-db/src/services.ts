import dotenv from "dotenv";
import { sendAnalytics, flushAnalytics } from "./analytics.js";
import { createDatabaseCore } from "./database.js";
import { checkOnline, getRegions, validateRegion } from "./regions.js";

dotenv.config({ quiet: true });

const CREATE_DB_WORKER_URL =
  process.env.CREATE_DB_WORKER_URL || "https://create-db-temp.prisma.io";
const CLAIM_DB_WORKER_URL =
  process.env.CLAIM_DB_WORKER_URL || "https://create-db.prisma.io";

export { flushAnalytics };

export function sendAnalyticsEvent(
  eventName: string,
  properties: Record<string, unknown>,
  cliRunId: string
) {
  return sendAnalytics(eventName, properties, cliRunId, CREATE_DB_WORKER_URL);
}

export async function ensureOnline() {
  try {
    await checkOnline(CREATE_DB_WORKER_URL);
  } catch {
    await flushAnalytics();
    process.exit(1);
  }
}

export function fetchRegions() {
  return getRegions(CREATE_DB_WORKER_URL);
}

export function validateRegionId(region: string) {
  return validateRegion(region, CREATE_DB_WORKER_URL);
}

export function createDatabase(
  region: string,
  userAgent?: string,
  cliRunId?: string,
  source?: "programmatic" | "cli"
) {
  return createDatabaseCore(
    region,
    CREATE_DB_WORKER_URL,
    CLAIM_DB_WORKER_URL,
    userAgent,
    cliRunId,
    source
  );
}
