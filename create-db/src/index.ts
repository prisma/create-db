import { os } from "@orpc/server";
import { createCli } from "trpc-cli";

import {
  type Region,
  type CreateDatabaseResult,
  type ProgrammaticCreateOptions,
} from "./types.js";
import { CreateFlags } from "./flags.js";
import { getCommandName } from "./database.js";
import { handleCreate, handleRegions } from "./commands/index.js";
import { createDatabase, fetchRegions } from "./services.js";

export type {
  Region,
  RegionId,
  CreateDatabaseResult,
  DatabaseResult,
  DatabaseError,
  ProgrammaticCreateOptions,
} from "./types.js";

export { isDatabaseError, isDatabaseSuccess, RegionSchema } from "./types.js";
export { CreateFlags, type CreateFlagsInput } from "./flags.js";

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
    .handler(async () => handleRegions()),
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
  return createDatabase(
    options?.region || "us-east-1",
    options?.userAgent,
    undefined,
    "programmatic"
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
