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

export function createDbCli() {
  return createCli({
    router,
    name: getCommandName(),
    version: "1.1.0",
    description: "Instantly create a temporary Prisma Postgres database",
  });
}

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

export async function regions(): Promise<Region[]> {
  return fetchRegions();
}
