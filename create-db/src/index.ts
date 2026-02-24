import { os } from "@orpc/server";
import { createCli } from "trpc-cli";

import {
  type Region,
  type CreateDatabaseResult,
  type ProgrammaticCreateOptions,
} from "./types.js";
import {
  CreateFlags,
  RegionsFlags,
} from "./cli/flags.js";
import { getCommandName } from "./core/database.js";
import { handleCreate, handleRegions } from "./cli/commands/index.js";
import { createDatabase, fetchRegions } from "./core/services.js";
import { parseTtlToMilliseconds, TTL_RANGE_TEXT } from "./utils/ttl.js";

export type {
  Region,
  RegionId,
  CreateDatabaseResult,
  DatabaseResult,
  DatabaseError,
  ProgrammaticCreateOptions,
} from "./types.js";

export { isDatabaseError, isDatabaseSuccess, RegionSchema } from "./types.js";
export {
  CreateFlags,
  RegionsFlags,
  type CreateFlagsInput,
  type RegionsFlagsInput,
} from "./cli/flags.js";

const router = os.router({
  create: os
    .meta({
      description: "Create a new Prisma Postgres database",
      default: true,
    })
    .input(CreateFlags)
    .handler(async ({ input }) => handleCreate(input)),

  regions: os
    .meta({ description: "List available Prisma Postgres regions" })
    .input(RegionsFlags)
    .handler(async ({ input }) => handleRegions(input)),
});

/**
 * Create and return the CLI instance for create-db.
 * @returns The configured CLI instance
 */
export function createDbCli() {
  return createCli({
    router,
    name: getCommandName(),
    version: "1.1.0",
    description: "Instantly create a temporary Prisma Postgres database",
  });
}

/**
 * Create a new Prisma Postgres database programmatically.
 * @param options - Options for creating the database
 * @returns A promise resolving to either a DatabaseResult or DatabaseError
 * @example
 * ```typescript
 * const result = await create({ region: "us-east-1" });
 * if (result.success) {
 *   console.log(result.connectionString);
 * }
 * ```
 */
export async function create(
  options?: ProgrammaticCreateOptions
): Promise<CreateDatabaseResult> {
  const ttlMs =
    typeof options?.ttl === "string"
      ? parseTtlToMilliseconds(options.ttl)
      : undefined;

  if (typeof options?.ttl === "string" && ttlMs === null) {
    return {
      success: false,
      error: "invalid_ttl",
      message: `Invalid ttl "${options.ttl}". Allowed range is ${TTL_RANGE_TEXT}.`,
    };
  }

  return createDatabase(
    options?.region || "us-east-1",
    options?.userAgent,
    undefined,
    "programmatic",
    ttlMs
  );
}

/**
 * List available Prisma Postgres regions programmatically.
 * @returns A promise resolving to an array of available regions
 * @example
 * ```typescript
 * const availableRegions = await regions();
 * console.log(availableRegions);
 * ```
 */
export async function regions(): Promise<Region[]> {
  return fetchRegions();
}
