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

/**
 * Send an analytics event to the create-db worker.
 * @param eventName - Name of the event to track
 * @param properties - Event properties
 * @param cliRunId - Unique identifier for this CLI run
 */
export function sendAnalyticsEvent(
  eventName: string,
  properties: Record<string, unknown>,
  cliRunId: string
) {
  return sendAnalytics(eventName, properties, cliRunId, CREATE_DB_WORKER_URL);
}

/**
 * Check if the create-db worker is online. Exits the process if offline.
 */
export async function ensureOnline() {
  try {
    await checkOnline(CREATE_DB_WORKER_URL);
  } catch {
    await flushAnalytics();
    process.exit(1);
  }
}

/**
 * Fetch available Prisma Postgres regions from the worker.
 * @returns A promise resolving to an array of available regions
 */
export function fetchRegions() {
  return getRegions(CREATE_DB_WORKER_URL);
}

/**
 * Validate that a region ID is valid.
 * @param region - The region ID to validate
 * @throws If the region is invalid
 */
export function validateRegionId(region: string) {
  return validateRegion(region, CREATE_DB_WORKER_URL);
}

/**
 * Create a new Prisma Postgres database.
 * @param region - AWS region for the database
 * @param userAgent - Optional custom user agent string
 * @param cliRunId - Optional unique identifier for this CLI run
 * @param source - Whether called from CLI or programmatic API
 * @returns A promise resolving to the database creation result
 */
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
